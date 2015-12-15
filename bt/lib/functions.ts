import {BadTypeError, BaseError, MissingValueError} from './errors';
import {Visitable as ASTVisitable} from './parser/ast';


export class FuncParams {
    named: any;
    body: ASTVisitable = null;

    constructor(public passed: any[], params: FuncParam[]) {
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

    getObject(name: string): string {
        if (!this.hasObject(name)) {
            throw new MissingValueError(this.named[name]);
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


export interface Thenable<T> {
    then(onFulfilled?: (t: T) => any, onRejected?: (err: any) => any): any;
    catch?(onRejected?: (err: any) => any): any;
}

export interface Executor<T> {
    (resolve: (v: T) => any, reject: (err: any) => any): void;
}

export class Immediate<T> implements FuncResult {
    private value: T;
    private err: any;

    constructor(f: Executor<T>) {
        let reject = (e) => this.err = e;
        let resolve = (v) => this.value = v;

        try {
            f(resolve, reject);
        } catch(e) {
            reject(e);
        }
    }

    static wrap<V>(f: () => V): Thenable<V> {
        return new Immediate((resolve) => {
            resolve(f());
        });
    }

    static resolve<V>(value: Thenable<V>|FuncResult): Thenable<V> {
        if (value !== undefined && value !== null && value.then !== undefined) {
            return <Thenable<V>>value;
        }
        return new Immediate((r) => r(value));
    }

    static reject<V>(value: V): Immediate<any> {
        return new Immediate((res, rej) => rej(value));
    }

    static defaultOnFulfilled<V>(value: V): V {
        return value;
    }

    static defaultOnRejected<V>(err: any): V {
        throw err;
    }

    then<V>(onFulfilled: (T) => V = Immediate.defaultOnFulfilled,
        onRejected: (any) => V = Immediate.defaultOnRejected): V {

        if (this.err !== undefined) {
            return onRejected(this.err);
        }
        return onFulfilled(this.value);
    }

    catch<V>(onRejected: (err: any) => V = Immediate.defaultOnRejected): V|T {
        if (this.err) {
            return onRejected(this.err);
        }
        return this.value;
    }
}


export interface FuncResult {
    then?(onFulfilled: (any) => any, onRejected?: (any) => any): any;
}
