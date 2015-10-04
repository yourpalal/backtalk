import {FuncResult} from "./functions";
import {Scope} from "./scope";
import * as stdLib from "./standard_lib";
import * as AST from "./parser/ast";
import * as parser from "./parser/parser";
import * as VM from "./vm";

/**
 * @module evaluator
 * @description contains classes & functions for evaluating backtalk code.
 */



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
 */
export class Evaluator {
    /**
     * @constructor
     * @param {scope.Scope} (optional) scope in which to evaluate BT code.
     */
    constructor(public scope: Scope = stdLib.inScope(new Scope())) {
    }

    enableStandardLibrary() {
        stdLib.inScope(this.scope);
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

}
