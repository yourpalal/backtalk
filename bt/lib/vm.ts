import {Evaluator} from "./evaluator";
export * from "./expressers";
import {Expresser, ConsoleExpresser} from "./expressers";
import {FuncDef} from "./funcdefs";
import * as syntax from "./syntax";

export class VM {
  private stack: VMFrame[];

  constructor(private expresser:Expresser = new ConsoleExpresser()) {
    this.stack = [];
  }

  public frame() {
    return this.stack[this.stack.length - 1];
  }

  public makeFrame(expresser? :Expresser) {
    this.stack.push(new VMFrame(expresser || this.expresser));
    return this.frame();
  }

  public execute(code: Instructions.Instruction[], frame: VMFrame, evaluator: Evaluator) {
    code.forEach((i) => {
      i.execute(this, frame, evaluator);
    });
    this.stack.pop();
    frame.finish();
  }
};

export class VMFrame extends syntax.BaseVisitor {
    bits: any[] = [];

    constructor(private expresser: Expresser) {
      super();
    }

    pop(): any {
      return this.bits.pop();
    }

    push(b: any) {
      this.bits.push(b);
    }

    yoink(count: number): any[] {
      return this.bits.splice(this.bits.length - count, count);
    }

    express(r: any) {
      this.expresser.express(r);
    }

    finish() {
      this.expresser.finish();
    }

    call(f: FuncDef, numArgs: number, thisArg: any) {
    }
}

export module Instructions {
  export interface Instruction {
      execute(vm: VM, frame: VMFrame, evaluator: Evaluator);
  }

  export class Push implements Instruction {
      constructor(private value: any) {}

      execute(vm: VM, frame: VMFrame, evaluator: Evaluator) {
        frame.push(this.value);
      }
  }

  export var PushZero = new Push(0);

  export class Express {
      static execute(vm: VM, frame: VMFrame, evaluator: Evaluator) {
        frame.express(frame.pop());
      }
  }

  export class Add {
      static execute(vm: VM, frame: VMFrame, evaluator: Evaluator) {
        var right = frame.pop();
        frame.push(frame.pop() + right);
      }
  }

  export class Sub {
      static execute(vm: VM, frame: VMFrame, evaluator: Evaluator) {
        var right = frame.pop();
        frame.push(frame.pop() - right);
      }
  }

  export class Mult {
      static execute(vm: VM, frame: VMFrame, evaluator: Evaluator) {
        var right = frame.pop();
        frame.push(frame.pop() * right);
      }
  }

  export class Div {
      static execute(vm: VM, frame: VMFrame, evaluator: Evaluator) {
        var right = frame.pop();
        frame.push(frame.pop() / right);
      }
  }

  export class CallFunc {
      constructor(private name: string) {
      }

      execute(vm: VM, frame: VMFrame, evaluator: Evaluator) {
        var func = evaluator.findFuncOrThrow(this.name),
            args = frame.yoink(func.vivification.length);
        frame.push(evaluator.simpleCall(func, args));
      }
  }

  export class CallHanging {
      constructor(private name: string, private body: syntax.CompoundExpression) {
      }

      execute(vm: VM, frame: VMFrame, evaluator: Evaluator) {
        var func = evaluator.findFuncOrThrow(this.name),
            args = frame.yoink(func.vivification.length);
        frame.push(evaluator.hangingCall(func, this.body, args));
      }
  }

  export class Get {
      constructor(private name: string) {
      }

      execute(vm: VM, frame: VMFrame, evaluator: Evaluator) {
        frame.push(evaluator.scope.get(this.name));
      }
  }

  export class GetVivifiable {
      constructor(private name: string) {
      }

      execute(vm: VM, frame: VMFrame, evaluator: Evaluator) {
        frame.push(evaluator.scope.getVivifiable(this.name));
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
