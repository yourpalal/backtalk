import {BadTypeError, BaseError} from './errors';
import {EventEmitter} from './events';
import {Visitable as ASTVisitable} from './parser/ast';

export class FuncParams {
    named: any;
    body: ASTVisitable = null;

    constructor(public passed: any[], params: FuncParam[]) {
        this.named = {};
        if (params === null) {
            return
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
}


export class FuncParam {
    constructor(public name: string, public value: any, public fromVar: boolean) {
    }

    withValue(value: any): FuncParam {
        return new FuncParam(this.name, value, this.fromVar);
    }

    static forVar(name: string) {
        return new FuncParam(name, null, true);
    }

    static forChoice(name: string) {
        return new FuncParam(name, 0, false);
    }
}


export class TooEagerError extends BaseError {
    constructor() {
        super("Attempted to get FuncResult value before it was fulfilled");
    }
}


export class Immediate<T> implements FuncResult {
    constructor(private value: T) {
    }

    static wrap<V>(value: Thenable<V>|FuncResult): Thenable<V> {
        if (value !== undefined && value !== null && value.then !== undefined) {
            return <Thenable<V>>value;
        }
        return new Immediate(value);
    }

    static defaultOnFulfilled<T>(value: T) {
        return value;
    }

    static defaultOnRejected(err: any) {
        throw err;
    }

    then<V>(onFulfilled: (T) => V = Immediate.defaultOnFulfilled): V {
        return onFulfilled(this.value);
    }
}


export interface FuncResult {
    then?(onFulfilled: (any) => any, onRejected?: (any) => any): any;
}
