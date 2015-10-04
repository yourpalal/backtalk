import {BaseError} from './errors';
import {FuncDef, FuncDefCollection, FuncParameterizer} from "./funcdefs";
import {FuncParams, FuncResult} from "./functions";
import {Visitable} from './parser/ast';
import {Trie} from "./trie";
import {AutoVar, Vivify} from "./vars";
import {Evaluator} from "./evaluator";

/** @module scope */

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

export interface Func {
    (p: FuncParams, e: Evaluator): FuncResult|void;
}

export class FuncHandle {
    public vivification: Vivify[];
    public parameterize: FuncParameterizer;

    constructor(public name: string, public impl: Func, funcdef: FuncDef) {
        this.vivification = funcdef.vivify;
        this.parameterize = funcdef.makeParameterizer();
    }

    call(args: any[], evaluator: Evaluator, body: Visitable = null): FuncResult {
        args = this.vivifyArgs(args);
        let params = this.parameterize(args);
        params.body = body;
        return this.impl.call(evaluator, params, evaluator);
    }

    vivifyArgs(args: any[]): any[] {
        for (var i = 0; i < this.vivification.length; i++) {
            var viv = this.vivification[i];
            var isAuto = (args[i] instanceof AutoVar);

            if (viv === Vivify.ALWAYS) {
                if (isAuto) {
                    continue;
                } else {
                    throw Error(`value used in place of variable in call to '${this.name}'`);
                }
            }

            if (!isAuto) {
                continue;
            }

            if (args[i].defined) {
                args[i] = args[i].value;
                continue;
            }

            if (viv === Vivify.NEVER) {
                throw Error(`undefined variable $${args[i].name} used in place of defined variable in call to '${this.name}'`);
            }
        }

        return args;
    }
}

/** @class scope.Scope
 * @description Scope keeps track of variable and function names. It uses
 *  prototype inheritance to make sure all variables from a parent scope are
 *  visible within child scopes. Function names are handled specially.
 */
export class Scope {
    names: { [key: string]: any };
    env: { [key: string]: any };
    funcs: Trie<FuncHandle>;

    constructor(public parent: Scope = null) {
        if (this.parent !== null) {
            this.names = Object.create(parent.names);
            this.env = Object.create(parent.env);
        } else {
            this.env =  <{ [key: string]: any }>new Object();
            this.names = <{ [key: string]: any }>new Object();
        }
        this.funcs = new Trie<FuncHandle>();
    }

    /**
     * @method scope.Scope#createSubScope
     * @returns A new scope that has all functions and variables of this one, but
     *  can add its own functions and variables as well.
     */
    createSubScope(): Scope {
        return new Scope(this);
    }

    set(name: string, val: any) {
        this.names[name] = val;
    }

    has(name: string): any {
        return name in this.names;
    }

    get(name: string): any {
        return this.names[name];
    }

    /** @method scope.Scope#getVivifiable
     * @returns {Autovar} handle for a given name in this scope.
     */
    getVivifiable(name: string): AutoVar {
        return new AutoVar(name, this, this.names[name]);
    }

    findFunc(name: string): FuncHandle {
        var f = this.funcs.get(name);
        if (f) {
            return f;
        }
        if (this.parent) {
            return this.parent.findFunc(name);
        }
        return null;
    }

    findFuncOrThrow(name: string): FuncHandle {
        var func = this.findFunc(name);
        if (func === null || typeof func === 'undefined') {
            throw new FunctionNameError(name);
        }
        return func;
    }

    addFunc(patterns: string[], impl: Func) {
        patterns.map((pattern) => {
            var result = FuncDefCollection.fromString(pattern);

            // now we can register a wrapper for all of the specified functions
            // that will append the dynamic parts of the pattern as arguments
            result.defs.forEach((funcdef) => {
                var name = funcdef.tokens.join(" ");
                this.funcs.put(name, new FuncHandle(name, impl, funcdef));
            });
        });
    }

}
