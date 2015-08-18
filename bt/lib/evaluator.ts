import * as vars from "./vars";
import * as scopes from "./scope";
import * as stdLib from "./standard_lib";
import * as syntax from "./syntax";

import {BaseError} from "./errors";

/**
 * @module evaluator
 * @description contains classes & functions for evaluating backtalk code.
 */


/**
 * @class FunctionNameError
 * @description thrown when a function is called but does not exist in
 *   the current scope.
 */
export class FunctionNameError extends BaseError {
  constructor(name) {
    super(`function "${name}" called but undefined`);
  }

  toString(): string {
    return this.msg;
  }
}

/**
 * @function evalBT
 * @description Evaluates a string or AST within a scope.
 * @returns The last value returned from the backtalk code.
 */
export function evalBT(source: string | syntax.Visitable, scope?: scopes.Scope) {
  var parsed;
  if (typeof (source) === 'string') {
    parsed = syntax.parse(<string>source, null);
  } else {
    parsed = source; // hopefuly this is the syntax
  }
  return (new Evaluator(scope)).eval(parsed);
}

/**
 * @class evaluator.Evaluator
 * @description BackTalk evaluator. Interprets BackTalk AST's within a given scope.
 *
 */
export class Evaluator extends syntax.BaseVisitor {
  /**
   * @member evaluator.Evaluator#newSubEval is true if this evaluator was created to evaluate the body of a
   * hanging call. If newSubEval is true, then `body` will hold the body of the
   * hanging call.
   */
  public newSubEval: boolean;
  public body: syntax.Visitable;

  /**
   * @constructor
   * @param {scopes.Scope} (optional) scope in which to evaluate BT code.
   */
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
      throw new FunctionNameError(name);
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

/**
 * @class evaluator.ArgsEvaluator
 * @description Syntax Visitor that returns AutoVar for all RefNodes. Used to
 * evaluate function paramaters.
 */
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

  visitFuncArg(node: syntax.FuncArg) {
    return  node.body.accept(this);
  }

  visitRef(node: syntax.Ref) {
    return this.subEval.scope.getVivifiable(node.name);
  }

}
