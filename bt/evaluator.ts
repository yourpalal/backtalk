/// <reference path="back_talker.ts" />
/// <reference path="scope.ts" />
/// <reference path="syntax.ts" />


module BackTalker {
  export function evalBT(source, scope: Scope) {
    var parsed;
    if (typeof (source) === 'string') {
      parsed = parse(<string>source, null);
    } else {
      parsed = source; // hopefuly this is the Syntax
    }
    return (new Evaluator(scope)).eval(parsed);
  }

  export class Evaluator extends Syntax.BaseVisitor {
    public newSubEval: boolean;
    public body: Syntax.Visitable;

    constructor(public scope: Scope) {
      super();
      this.scope = scope || StdLib.inScope(new Scope());
      this.newSubEval = false;
    }

    evalString(source: string) {
      return this.eval(parse(source));
    }

    eval(node: Syntax.Visitable): any {
      this.body = node;
      return node.accept(this);
    }

    makeSubEvaluator(): Evaluator {
      var subEval = new Evaluator(new Scope(this.scope));
      subEval.newSubEval = true;
      return subEval;
    }

    callFunc(subEval, name, args) {
      var i = 0
        , f = this.scope.findFunc(name)
        , argsGetter = new ArgsEvaluator(this);

      if ((f || 0) === 0) {
        throw Error("function called but undefined " + name);
      }

      args = args.map(function(arg) {
        return arg.accept(argsGetter);
      }, this);

      for (; i < f.vivification.length; i++) {
        var viv = f.vivification[i]
          , defined = args[i].defined
          , isAuto = (args[i] instanceof AutoVar);

        if (viv === Vivify.ALWAYS) {
          if (isAuto) {
            continue;
          } else {
            throw Error("value used in place of variable in call to '" + name + "'");
          }
        }

        if (!isAuto) {
          continue;
        }

        if (defined) {
          args[i] = args[i].value;
          continue;
        }

        if (viv === Vivify.NEVER) {
          throw Error("undefined variable $" + args[i].name + " used in place of defined variable in call to '" + name + "'");
        }
      }

      return f.impl.apply(subEval, args);
    }

    visitHangingCall(node: Syntax.HangingCall) {
      var subEval = this.makeSubEvaluator();
      subEval.body = node.body;
      return this.callFunc(subEval, node.name, node.args);
    }

    visitFuncCall(node) {
      this.newSubEval = false;
      return this.callFunc(this, node.name, node.args);
    }

    visitBinOpNode(node: Syntax.BinOpNode, ...args) {
      var left = this.eval(node.left),
        i = 0;

      for (i = 0; i < node.ops.length; i++) {
        left = node.ops[i].accept(this, left);
      }
      return left;
    }

    visitAddOp(node: Syntax.AddOp, left) {
      return left + node.right.accept(this);
    }

    visitSubOp(node, left) {
      return left - node.right.accept(this);
    }

    visitDivideOp(node, left) {
      return left / node.right.accept(this);
    }

    visitMultOp(node, left) {
      return left * node.right.accept(this);
    }

    visitLiteral(node) {
      return node.val;
    }

    visitUnaryMinus(node) {
      return - node.accept(this);
    }

    visitRef(node) {
      return this.scope.get(node.name);
    }

    visitCompoundExpression(node) {
      var result;
      node.parts.forEach(function(part) {
        result = part.accept(this);
      }, this);
      return result;
    }
  }

  // ArgsEvaluator is an Syntax Visitor that returns AutoVar for all RefNodes
  class ArgsEvaluator extends Syntax.BaseVisitor {
    constructor(public subEval: Evaluator) {
      super()
    }

    visitAddOp(a: Syntax.AddOp): any { return a.accept(this.subEval); }
    visitSubOp(a: Syntax.SubOp): any { return a.accept(this.subEval); }
    visitDivideOp(a: Syntax.DivideOp): any { return a.accept(this.subEval); }
    visitMultOp(a: Syntax.MultOp): any { return a.accept(this.subEval); }
    visitBinOpNode(a: Syntax.BinOpNode): any { return a.accept(this.subEval); }
    visitLiteral(a: Syntax.Literal): any { return a.accept(this.subEval); }
    visitBareWord(a: Syntax.BareWord): any { return a.accept(this.subEval); }
    visitUnaryMinus(a: Syntax.UnaryMinus): any { return a.accept(this.subEval); }
    visitCompoundExpression(a: Syntax.CompoundExpression): any { return a.accept(this.subEval); }
    visitFuncCall(a: Syntax.FuncCall): any { return a.accept(this.subEval); }

    visitRef(node: Syntax.Ref) {
      return this.subEval.scope.getVivifiable(node.name);
    }

  }
}
