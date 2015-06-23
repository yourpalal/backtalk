import syntax = require("./syntax");
import scopes = require("./scope");
import vars = require("./vars");
import stdLib = require("./standard_lib");


export function evalBT(source: string | syntax.Visitable, scope?: scopes.Scope) {
  var parsed;
  if (typeof (source) === 'string') {
    parsed = syntax.parse(<string>source, null);
  } else {
    parsed = source; // hopefuly this is the syntax
  }
  return (new Evaluator(scope)).eval(parsed);
}

export class Evaluator extends syntax.BaseVisitor {
  public newSubEval: boolean;
  public body: syntax.Visitable;

  constructor(public scope?: scopes.Scope) {
    super();
    this.scope = scope || stdLib.inScope(new scopes.Scope());
    this.newSubEval = false;
  }

  evalString(source: string): any {
    return this.eval(syntax.parse(source));
  }

  eval(node: syntax.Visitable): any {
    this.body = node;
    return node.accept(this);
  }

  makeSubEvaluator(): Evaluator {
    var subEval = new Evaluator(new scopes.Scope(this.scope));
    subEval.newSubEval = true;
    return subEval;
  }

  callFunc(subEval, name, args) {
    var i = 0
      , f = this.scope.findFunc(name)
      , argsGetter = new ArgsEvaluator(this);

    if ((f || 0) === 0) {
      throw new Error("function called but undefined " + name);
    }

    args = args.map(function(arg) {
      return arg.accept(argsGetter);
    }, this);

    for (; i < f.vivification.length; i++) {
      var viv = f.vivification[i]
        , defined = args[i].defined
        , isAuto = (args[i] instanceof vars.AutoVar);

      if (viv === vars.Vivify.ALWAYS) {
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

      if (viv === vars.Vivify.NEVER) {
        throw Error("undefined variable $" + args[i].name + " used in place of defined variable in call to '" + name + "'");
      }
    }

    return f.impl.call(subEval, f.parameterize(args));
  }

  visitHangingCall(node: syntax.HangingCall) {
    var subEval = this.makeSubEvaluator();
    subEval.body = node.body;
    return this.callFunc(subEval, node.name, node.args);
  }

  visitFuncCall(node) {
    // TODO: should we restore newSubEval after this?
    this.newSubEval = false;
    return this.callFunc(this, node.name, node.args);
  }

  visitBinOpNode(node: syntax.BinOpNode, ...args) {
    var left = this.eval(node.left),
      i = 0;

    for (i = 0; i < node.ops.length; i++) {
      left = node.ops[i].accept(this, left);
    }
    return left;
  }

  visitAddOp(node: syntax.AddOp, left) {
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

  visitLiteral(node: syntax.Literal) {
    return node.val;
  }

  visitUnaryMinus(node: syntax.UnaryMinus) {
    return - node.accept(this);
  }

  visitRef(node: syntax.Ref) {
    return this.scope.get(node.name);
  }

  visitCompoundExpression(node: syntax.CompoundExpression) {
    var result;
    node.parts.forEach(function(part) {
      result = part.accept(this);
    }, this);
    return result;
  }
}

// ArgsEvaluator is an syntax Visitor that returns AutoVar for all RefNodes
class ArgsEvaluator extends syntax.BaseVisitor {
  constructor(public subEval: Evaluator) {
    super()
  }

  visitAddOp(a: syntax.AddOp): any { return a.accept(this.subEval); }
  visitSubOp(a: syntax.SubOp): any { return a.accept(this.subEval); }
  visitDivideOp(a: syntax.DivideOp): any { return a.accept(this.subEval); }
  visitMultOp(a: syntax.MultOp): any { return a.accept(this.subEval); }
  visitBinOpNode(a: syntax.BinOpNode): any { return a.accept(this.subEval); }
  visitLiteral(a: syntax.Literal): any { return a.accept(this.subEval); }
  visitBareWord(a: syntax.BareWord): any { return a.accept(this.subEval); }
  visitUnaryMinus(a: syntax.UnaryMinus): any { return a.accept(this.subEval); }
  visitCompoundExpression(a: syntax.CompoundExpression): any { return a.accept(this.subEval); }
  visitFuncCall(a: syntax.FuncCall): any { return a.accept(this.subEval); }

  visitRef(node: syntax.Ref) {
    return this.subEval.scope.getVivifiable(node.name);
  }

}
