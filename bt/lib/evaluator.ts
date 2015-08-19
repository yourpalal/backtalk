import * as vars from "./vars";
import * as scopes from "./scope";
import * as stdLib from "./standard_lib";
import * as syntax from "./syntax";
import * as VM from "./vm";

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
  constructor(public scope?: scopes.Scope, public vm:VM.VM = new VM.VM()) {
    super();
    this.scope = scope || stdLib.inScope(new scopes.Scope());
    this.newSubEval = false;
  }

  evalString(source: string): any {
    return this.eval(syntax.parse(source));
  }

  eval(node: syntax.Visitable): any {
    var expresser = new VM.ResultExpresser();
    this.evalExpressions(node, expresser);
    return expresser.result;
  }

  evalExpressions(node: syntax.Visitable, expresser: VM.Expresser): void {
    this.body = node;
    var compiled = VM.Compiler.compile(node);
    this.vm.execute(compiled, this.vm.makeFrame(expresser), this);
  }

  makeSubEvaluator(body: syntax.Visitable): Evaluator {
    var subEval = new Evaluator(new scopes.Scope(this.scope));
    subEval.newSubEval = true;
    subEval.body = body;
    return subEval;
  }

  findFuncOrThrow(name: string): scopes.FuncHandle {
    var func = this.scope.findFunc(name);
    if (typeof func === 'undefined') {
      throw new FunctionNameError(name);
    }
    return func;
  }

  vivifyArgs(func: scopes.FuncHandle, args: any[]): any[] {
    for (var i = 0; i < func.vivification.length; i++) {
      var viv = func.vivification[i]
        , isAuto = (args[i] instanceof vars.AutoVar);

      if (viv === vars.Vivify.ALWAYS) {
        if (isAuto) {
          continue;
        } else {
          throw Error("value used in place of variable in call to '" + func.name + "'");
        }
      }

      if (!isAuto) {
        continue;
      }

      if (args[i].defined) {
        args[i] = args[i].value;
        continue;
      }

      if (viv === vars.Vivify.NEVER) {
        throw Error("undefined variable $" + args[i].name + " used in place of defined variable in call to '" + name + "'");
      }
    }

    return args;
  }

  hangingCall(func: scopes.FuncHandle, body: syntax.Visitable, args: any[]) {
    args = this.vivifyArgs(func, args);
    return func.impl.call(this.makeSubEvaluator(body), func.parameterize(args));
  }

  simpleCall(func: scopes.FuncHandle, args: any[]) {
    args = this.vivifyArgs(func, args);
    this.newSubEval = false;
    return func.impl.call(this, func.parameterize(args));
  }
}
