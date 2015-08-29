import {Evaluator} from "./evaluator";
export * from "./expressers";
import {Expresser, ConsoleExpresser} from "./expressers";
import {FuncDef} from "./funcdefs";
import * as syntax from "./syntax";


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
            result = evaluator.simpleCall(func, args)
        if (result.isFulfilled()) {
          return vm.push(result.get());
        }

        vm.wait();
        result.then((value) => {
            vm.push(value);
            vm.resume();
        });
      }
  }

  export class CallHanging {
      constructor(private name: string, private body: syntax.CompoundExpression) {
      }

      execute(vm: VM, evaluator: Evaluator) {
        var func = evaluator.findFuncOrThrow(this.name),
            args = vm.yoink(func.vivification.length),
            result = evaluator.hangingCall(func, this.body, args);
        if (result.isFulfilled()) {
          return vm.push(result.get());
        }

        vm.wait();
        result.then((value) => {
          vm.push(value);
          vm.resume();
        });
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

class ArgsCompiler extends syntax.BaseVisitor {
  constructor(private compiler: Compiler) { super(); }

  visitAddOp(a: syntax.AddOp): any { return a.accept(this.compiler); }
  visitSubOp(a: syntax.SubOp): any { return a.accept(this.compiler); }
  visitDivideOp(a: syntax.DivideOp): any { return a.accept(this.compiler); }
  visitMultOp(a: syntax.MultOp): any { return a.accept(this.compiler); }
  visitBinOpNode(a: syntax.BinOpNode): any { return a.accept(this.compiler); }
  visitLiteral(a: syntax.Literal): any { return a.accept(this.compiler); }
  visitBareWord(a: syntax.BareWord): any { return a.accept(this.compiler); }
  visitUnaryMinus(a: syntax.UnaryMinus): any { return a.accept(this.compiler); }
  visitCompoundExpression(a: syntax.CompoundExpression): any { return a.accept(this.compiler); }
  visitFuncCall(a: syntax.FuncCall): any { return a.accept(this.compiler); }

  visitFuncArg(node: syntax.FuncArg) {
    node.body.accept(this);
  }

  visitRef(node: syntax.Ref) {
    this.compiler.push(new Instructions.GetVivifiable(node.name), node.code);
  }
}

export class Compiler extends syntax.BaseVisitor {
  instructions: Instructions.Instruction[] = [];
  private argsCompiler: ArgsCompiler;

  constructor() {
    super();
    this.argsCompiler = new ArgsCompiler(this);
  }

  static compile(ast: syntax.Visitable): Instructions.Instruction[] {
    var c = new Compiler();
    ast.accept(c);
    return c.instructions;
  }

  push(i: Instructions.Instruction, code: syntax.Code) {
    this.instructions.push(i);
  }

  visitHangingCall(node: syntax.HangingCall) {
    node.args.forEach((v) => v.accept(this));
    this.push(new Instructions.CallHanging(node.name, node.body), node.code);
  }

  visitFuncCall(node: syntax.FuncCall) {
    node.args.forEach((arg) => arg.accept(this));
    this.push(new Instructions.CallFunc(node.name), node.code);
  }

  visitBinOpNode(node: syntax.BinOpNode) {
    node.left.accept(this);
    node.ops.forEach((op) => op.accept(this));
  }

  visitAddOp(node: syntax.AddOp) {
    node.right.accept(this);
    this.push(Instructions.Add, node.code);
  }

  visitSubOp(node: syntax.SubOp) {
    node.right.accept(this);
    this.push(Instructions.Sub, node.code);
  }

  visitDivideOp(node: syntax.DivideOp) {
    node.right.accept(this);
    this.push(Instructions.Div, node.code);
  }

  visitMultOp(node: syntax.MultOp) {
    node.right.accept(this);
    this.push(Instructions.Mult, node.code);
  }

  visitLiteral(node: syntax.Literal) {
    this.push(new Instructions.Push(node.val), node.code);
  }

  visitUnaryMinus(node: syntax.UnaryMinus) {
    this.push(Instructions.PushZero, node.code);
    node.val.accept(this);
    this.push(Instructions.Sub, node.code);
  }

  visitFuncArg(node: syntax.FuncArg) {
    node.body.accept(this.argsCompiler);
  }

  visitRef(node: syntax.Ref) {
    this.push(new Instructions.Get(node.name), node.code);
  }

  visitCompoundExpression(node: syntax.CompoundExpression) {
    node.parts.forEach((part) => {
      part.accept(this);
      this.push(Instructions.Express, node.code);
    });
  }
}
