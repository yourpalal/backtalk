import {BaseError} from "./errors";
import {FuncResult} from "./functions";
import {FuncHandle, Scope} from "./scope";
import * as stdLib from "./standard_lib";
import * as AST from "./parser/ast";
import * as parser from "./parser/parser";
import * as vars from "./vars";
import * as VM from "./vm";

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
 * @returns {FuncResult} result of the backtalk code.
 */
export function evalBT(source: string | AST.Visitable, scope?: Scope): FuncResult {
  var parsed;
  if (typeof (source) === 'string') {
    parsed = parser.parse(<string>source, null);
  } else {
    parsed = source;
  }
  return (new Evaluator(scope)).eval(parsed);
}

/**
 * @class evaluator.Evaluator
 * @description BackTalk evaluator. Provides scope and javascript binding for evaluating
 *              BackTalk code.
 *
 */
export class Evaluator {
  /**
   * @constructor
   * @param {scope.Scope} (optional) scope in which to evaluate BT code.
   */
  constructor(public scope: Scope = stdLib.inScope(new Scope())) {
  }

  evalString(source: string): FuncResult {
    return this.eval(parser.parse(source));
  }

  eval(node: AST.Visitable): FuncResult {
    let expresser = new VM.ResultExpresser();
    this.evalExpressions(node, expresser);
    return expresser.result;
  }

  evalExpressions(node: AST.Visitable, expresser: VM.Expresser): void {
    let compiled = VM.Compiler.compile(node);
    let vm = new VM.VM(compiled, this, expresser);
    vm.resume();
  }

  makeSub(): Evaluator {
    return new Evaluator(new Scope(this.scope));
  }

  findFuncOrThrow(name: string): FuncHandle {
    var func = this.scope.findFunc(name);
    if (func === null || typeof func === 'undefined') {
      throw new FunctionNameError(name);
    }
    return func;
  }

  vivifyArgs(func: FuncHandle, args: any[]): any[] {
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

  hangingCall(func: FuncHandle, body: AST.Visitable, args: any[]): FuncResult {
    args = this.vivifyArgs(func, args);
    let params = func.parameterize(args);
    params.body = body;

    return func.impl.call(this, params, this);
  }

  simpleCall(func: FuncHandle, args: any[]): FuncResult {
    args = this.vivifyArgs(func, args);
    return func.impl.call(this, func.parameterize(args), this);
  }
}
