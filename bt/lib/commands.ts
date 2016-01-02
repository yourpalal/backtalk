import {BadTypeError, BaseError, MissingValueError} from './errors';
import {Visitable as ASTVisitable} from './parser/ast';


export class CommandParams {
    named: any;
    body: ASTVisitable = null;

    constructor(public passed: any[], params: CommandParam[]) {
        this.named = {};
        if (params === null) {
            return;
        }

        var i = 0;
        params.forEach((param) => {
            if (param.fromVar) {
                this.named[param.name] = passed[i];
                i++;
            } else {
                this.named[param.name] = param.value;
            }
        });
    }

    has(name: string): boolean {
        if (this.named.hasOwnProperty(name)) {
            return true;
        }
        return false;
    }

    get(name: string, missing?: any): any {
        if (this.has(name)) {
            return this.named[name];
        }
        return missing;
    }

    choose<T>(name: string, values: T[], missing?: T): T {
        if (this.has(name)) {
            return values[this.named[name]];
        }
        return missing;
    }

    hasNumber(name: string): boolean {
        return this.has(name) && (typeof this.named[name] == 'number');
    }

    getNumber(name: string): number {
        if (!this.hasNumber(name)) {
            throw new BadTypeError(this.named[name], 'number');
        }
        return this.named[name];
    }

    hasString(name: string): boolean {
        return this.has(name) && (typeof this.named[name] == 'string');
    }

    getString(name: string): string {
        if (!this.hasString(name)) {
            throw new BadTypeError(this.named[name], 'string');
        }
        return this.named[name];
    }

    hasObject(name: string): boolean {
        return this.has(name) && (this.named[name] !== null) && (this.named[name] !== undefined);
    }

    getObject(name: string): any {
        if (!this.hasObject(name)) {
            throw new MissingValueError(this.named[name]);
        }
        return this.named[name];
    }
}


export class CommandParam {
    constructor(public name: string, public value: any, public fromVar: boolean) {
    }

    withValue(value: any): CommandParam {
        return new CommandParam(this.name, value, this.fromVar);
    }

    static forVar(name: string) {
        return new CommandParam(name, null, true);
    }

    static forChoice(name: string) {
        return new CommandParam(name, 0, false);
    }
}


export class TooEagerError extends BaseError {
    constructor() {
        super("Attempted to get CommandResult value before it was fulfilled");
    }
}


export interface CommandResult {
    then?(onFulfilled: (any) => any, onRejected?: (any) => any): any;
}
