import {Evaluator} from "./evaluator";
export * from "./expressers";
import {Expresser, ConsoleExpresser} from "./expressers";
import {FuncResult} from "./functions";
import {FuncDef} from "./funcdefs";
import * as AST from "./parser/ast";


export class VM {
    protected stack: any[] = [];

    protected ip: number = 0;
    protected waiting: boolean = true;

    constructor(public instructions: Instructions.Instruction[],
              protected evaluator: Evaluator,
              protected expresser: Expresser = new ConsoleExpresser()) {
    }

    pop(): any {
      return this.stack.pop();
    }

    push(b: any) {
      this.stack.push(b);
    }

    yoink(count: number): any[] {
      return this.stack.splice(this.stack.length - count, count);
    }

    express(r: any) {
      this.expresser.express(r);
    }

    resume() {
      this.waiting = false;
      while (!this.isFinished() && !this.waiting) {
        this.instructions[this.ip++].execute(this, this.evaluator);
      }

      if (this.isFinished()) {
        this.finish();
      }
    }

    wait() {
      this.waiting = true;
    }

    isFinished() {
      return this.ip >= this.instructions.length;
    }

    finish() {
      this.expresser.finish();
    }
}

export module Instructions {
  export interface Instruction {
      execute(vm: VM, evaluator: Evaluator);
  }

  export class Push implements Instruction {
      constructor(private value: any) {}

      execute(vm: VM, evaluator: Evaluator) {
        vm.push(this.value);
      }
  }

  export var PushZero = new Push(0);

  export class Express {
      static execute(vm: VM, evaluator: Evaluator) {
        vm.express(vm.pop());
      }
  }

  export class Add {
      static execute(vm: VM, evaluator: Evaluator) {
        var right = vm.pop();
        vm.push(vm.pop() + right);
      }
  }

  export class Sub {
      static execute(vm: VM, evaluator: Evaluator) {
        var right = vm.pop();
        vm.push(vm.pop() - right);
      }
  }

  export class Mult {
      static execute(vm: VM, evaluator: Evaluator) {
        var right = vm.pop();
        vm.push(vm.pop() * right);
      }
  }

  export class Div {
      static execute(vm: VM, evaluator: Evaluator) {
        var right = vm.pop();
        vm.push(vm.pop() / right);
      }
  }

  export class CallFunc {
      constructor(private name: string) {
      }

      execute(vm: VM, evaluator: Evaluator) {
        var func = evaluator.findFuncOrThrow(this.name),
            args = vm.yoink(func.vivification.length),
            result = evaluator.simpleCall(func, args);

          CallFunc.handleFuncResult(vm, evaluator, result);
      }

      static handleFuncResult(vm: VM, evaluator: Evaluator, result: FuncResult) {
        if (result === undefined || result === null || result.then === undefined) {
          return vm.push(result);
        }

        vm.wait();
        result.then((value) => {
            vm.push(value);
            vm.resume();
        });
      }
  }

  export class CallHanging {
      constructor(private name: string, private body: AST.CompoundExpression) {
      }

      execute(vm: VM, evaluator: Evaluator) {
        var func = evaluator.findFuncOrThrow(this.name),
            args = vm.yoink(func.vivification.length),
            result = evaluator.hangingCall(func, this.body, args);

        CallFunc.handleFuncResult(vm, evaluator, result);
      }
  }

  export class Get {
      constructor(private name: string) {
      }

      execute(vm: VM, evaluator: Evaluator) {
        vm.push(evaluator.scope.get(this.name));
      }
  }

  export class GetVivifiable {
      constructor(private name: string) {
      }

      execute(vm: VM, evaluator: Evaluator) {
        vm.push(evaluator.scope.getVivifiable(this.name));
      }
  }
}

class ArgsCompiler extends AST.BaseVisitor {
  constructor(private compiler: Compiler) { super(); }

  visitVisitable(a: AST.Visitable): any { return a.accept(this.compiler); }

  visitFuncArg(node: AST.FuncArg) {
    node.body.accept(this);
  }

  visitRef(node: AST.Ref) {
    this.compiler.push(new Instructions.GetVivifiable(node.name), node.code);
  }
}

export class Compiler extends AST.BaseVisitor {
  instructions: Instructions.Instruction[] = [];
  private argsCompiler: ArgsCompiler;

  constructor() {
    super();
    this.argsCompiler = new ArgsCompiler(this);
  }

  static compile(ast: AST.Visitable): Instructions.Instruction[] {
    var c = new Compiler();
    ast.accept(c);
    return c.instructions;
  }

  push(i: Instructions.Instruction, code: AST.Code) {
    this.instructions.push(i);
  }

  visitHangingCall(node: AST.HangingCall) {
    // don't want to visit body as well
    node.acceptForArgs(this);
    this.push(new Instructions.CallHanging(node.name, node.body), node.code);
  }

  visitFuncCall(node: AST.FuncCall) {
    node.acceptForChildren(this);
    this.push(new Instructions.CallFunc(node.name), node.code);
  }

  visitBinOpNode(node: AST.BinOpNode) {
    node.acceptForChildren(this);
  }

  visitAddOp(node: AST.AddOp) {
    node.acceptForChildren(this);
    this.push(Instructions.Add, node.code);
  }

  visitSubOp(node: AST.SubOp) {
    node.acceptForChildren(this);
    this.push(Instructions.Sub, node.code);
  }

  visitDivideOp(node: AST.DivideOp) {
    node.acceptForChildren(this);
    this.push(Instructions.Div, node.code);
  }

  visitMultOp(node: AST.MultOp) {
    node.acceptForChildren(this);
    this.push(Instructions.Mult, node.code);
  }

  visitLiteral(node: AST.Literal) {
    this.push(new Instructions.Push(node.val), node.code);
  }

  visitUnaryMinus(node: AST.UnaryMinus) {
    this.push(Instructions.PushZero, node.code);
    node.acceptForChildren(this);
    this.push(Instructions.Sub, node.code);
  }

  visitFuncArg(node: AST.FuncArg) {
    node.acceptForChildren(this.argsCompiler);
  }

  visitRef(node: AST.Ref) {
    this.push(new Instructions.Get(node.name), node.code);
  }

  visitCompoundExpression(node: AST.CompoundExpression) {
    node.parts.forEach((part) => {
      part.accept(this);
      this.push(Instructions.Express, part.code);
    });
  }
}
