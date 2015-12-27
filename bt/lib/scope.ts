import {BaseError} from './errors';
import {CommandDef, CommandDefCollection, CommandParameterizer} from "./commanddefs";
import {CommandResult} from "./commands";
import {Visitable} from './parser/ast';
import {Trie} from "./trie";
import {AutoVar, Vivify} from "./vars";
import {Evaluator} from "./evaluator";
import {Command, CommandMeta} from "./library";

/** @module scope */

/**
 * @class CommandNameError
 * @description thrown when a function is called but does not exist in
 *   the current scope.
 */
export class CommandNameError extends BaseError {
    constructor(name) {
        super(`command "${name}" called but undefined`);
    }

    toString(): string {
        return this.msg;
    }
}

export class CommandHandle {
    public vivification: Vivify[];
    public parameterize: CommandParameterizer;

    constructor(public name: string, public impl: Command, commanddef: CommandDef, public meta: CommandMeta) {
        this.vivification = commanddef.vivify;
        this.parameterize = commanddef.makeParameterizer();
    }

    call(args: any[], evaluator: Evaluator, body: Visitable = null): CommandResult{
        args = this.vivifyArgs(args);
        let params = this.parameterize(args);
        params.body = body;
        return this.impl.call(evaluator, params, evaluator, this.meta);
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
 * @description Scope keeps track of variable and command names. It uses
 *  prototype inheritance to make sure all variables from a parent scope are
 *  visible within child scopes. Function names are handled specially.
 */
export class Scope {
    names: any;
    env: any;
    commands: Trie<CommandHandle>;

    constructor(public parent: Scope = null) {
        if (this.parent !== null) {
            this.names = Object.create(parent.names);
            this.env = Object.create(parent.env);
        } else {
            this.env =  <{ [key: string]: any }>new Object();
            this.names = <{ [key: string]: any }>new Object();
        }
        this.commands = new Trie<CommandHandle>();
    }

    /**
     * @method scope.Scope#createSubScope
     * @returns A new scope that has all commands and variables of this one, but
     *  can add its own commands and variables as well.
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

    findCommand(name: string): CommandHandle {
        var f = this.commands.get(name);
        if (f) {
            return f;
        }
        if (this.parent) {
            return this.parent.findCommand(name);
        }
        return null;
    }

    findCommandOrThrow(name: string): CommandHandle {
        var func = this.findCommand(name);
        if (func === null || typeof func === 'undefined') {
            throw new CommandNameError(name);
        }
        return func;
    }

    addCommand(patterns: string[], impl: Command, meta?: CommandMeta) {
        patterns.map((pattern) => {
            var result = CommandDefCollection.fromString(pattern);

            // now we can register a wrapper for all of the specified functions
            // that will append the dynamic parts of the pattern as arguments
            result.defs.forEach((commanddef) => {
                var name = commanddef.tokens.join(" ");
                this.commands.put(name, new CommandHandle(name, impl, commanddef, meta));
            });
        });
    }

}
