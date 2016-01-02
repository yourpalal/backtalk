import {CommandResult} from "./commands";

export interface Thenable<T> {
    then(onFulfilled?: (t: T) => any, onRejected?: (err: any) => any): any;
    catch?(onRejected?: (err: any) => any): any;
}

export interface Executor<T> {
    (resolve: (v: T) => any, reject: (err: any) => any): void;
}

export class Immediate<T> implements CommandResult {
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

    static resolve<V>(value: Thenable<V>|CommandResult): Thenable<V> {
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
