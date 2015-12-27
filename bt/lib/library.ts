import {Scope} from './scope';
import {FuncParams, FuncResult} from './functions';
import {Evaluator} from './evaluator';


export interface Func {
    (p: FuncParams, e: Evaluator, d: FuncMeta): FuncResult|void;
}


export class FuncAdder<Parent> {
    public library: Library;

    constructor(private parent: LibraryBuilder<Parent>,
        private name: string,
        private meta: FuncMeta) {

        this.library = parent.library;
    }

    help(val: string): this {
        this.meta.help = val;
        return this;
    }

    impl(val: Func): this {
        this.library.funcs[this.name].impl = val;
        return this;
    }

    callsBody(usage: FuncBodyUsage): this {
        this.meta.callsBody = usage;
        return this;
    }

    includes(): LibraryBuilder<this> {
        return new LibraryBuilder(this.meta.includes, this);
    }

    // these methods really act on the LibraryBuilder, but
    // it is annoying to call .parent.func or .parent.done
    func(name: string, patterns: string[]): FuncAdder<Parent> {
        return this.parent.func(name, patterns);
    }

    ref(name: string, val: any): LibraryBuilder<Parent> {
        return this.parent.ref(name, val);
    };

    done(): Parent {
        return this.parent.done();
    }
}

export enum FuncBodyUsage {
    ONCE,
    REPEATEDLY,
    LATER
};

export class LibraryBuilder<Parent> {
    constructor(public library: Library, public parent: Parent) {
    }

    // for convenience
    done(): Parent {
        return this.parent;
    }

    func(name: string, patterns: string[]): FuncAdder<Parent> {
        this.library.funcs[name] = {
            meta: new FuncMeta(),
            impl: null,
            patterns: patterns
        };
        return new FuncAdder(this, name, this.library.funcs[name].meta);
    }

    ref(name: string, val: any): this {
        this.library.refs[name] = val;
        return  this;
    }
}

export class Library {
    // export these for convenience
    static ONCE = FuncBodyUsage.ONCE;
    static REPEATEDLY = FuncBodyUsage.REPEATEDLY;
    static LATER = FuncBodyUsage.LATER;

    static create(): LibraryBuilder<Library> {
        var lib = new Library();
        return new LibraryBuilder<Library>(lib, lib);
    }

    funcs: {
        [name: string]: {meta: FuncMeta, impl: Func, patterns: string[]};
    } = {};

    refs: {
        [name: string]: any
    } = {};

    addToScope(scope: Scope, funcImpls: {[name: string]: Func} = {},
        refs: {[name: string]: any} = {}) {

        for (var name in this.funcs) {
            if (!this.funcs.hasOwnProperty(name)) { continue; }

            let {impl, patterns, meta} = this.funcs[name];
            impl = funcImpls[name] || impl;

            if (impl) {
                scope.addFunc(patterns, impl, meta);
            }
        }

        for (name in refs) {
            if (!refs.hasOwnProperty(name)) { continue; }
            scope.set(name, refs[name]);
        }

        for (name in this.refs) {
            if (!this.refs.hasOwnProperty(name)) { continue; }
            if (refs.hasOwnProperty(name)) { continue; } // don't override refs arg

            if ((typeof this.refs[name]) == "function") {
                scope.set(name, this.refs[name]());
            } else {
                scope.set(name, this.refs[name]);
            }
        }
    }
};

export class RefDoc {
    constructor(public name: string, public help: string) {
    }
}

export class FuncMeta {
    callsBody: FuncBodyUsage;
    help: string;

    includes: Library = new Library();
}
