import {DoNothingExpresser} from "./expressers";
import {CommandResult} from "./commands";
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
 * @returns {CommandResult} result of the backtalk code.
 */
export function evalBT(source: string | AST.Visitable, scope?: Scope): CommandResult {
    var parsed;
    if (typeof (source) === 'string') {
        parsed = parser.parseOrThrow(<string>source, null);
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

    evalString(source: string): CommandResult {
        return this.eval(parser.parseOrThrow(source));
    }

    eval(node: AST.Visitable): CommandResult {
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
        let evaluator = new Evaluator(new Scope(this.scope));
        evaluator.compiled = this.compiled;
        return evaluator;
    }

    private compiled: { [name: string]: VM.Instructions.Instruction[]} = {};

    compile(src: string, name: string) {
        name =  '/' + name;
        this.compiled[name] = VM.Compiler.compile(parser.parseOrThrow(src, name));
    }

    hasCompiled(name: string) {
        return `/${name}` in this.compiled;
    }

    runForResult(name: string): CommandResult {
        let expresser = new VM.ResultExpresser();
        this.run(name, expresser);
        return expresser.result;
    }

    run(name: string, expresser: VM.Expresser = new DoNothingExpresser()): void {
        name =  '/' + name;
        let vm = new VM.VM(this.compiled[name], this, expresser);
        vm.resume();
    }
}
