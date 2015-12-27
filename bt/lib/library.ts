import {Scope} from './scope';
import {CommandParams, CommandResult} from './commands';
import {Evaluator} from './evaluator';


export interface Command {
    (p: CommandParams, e: Evaluator, d: CommandMeta): CommandResult|void;
}


export class CommandAdder<Parent> {
    public library: Library;

    constructor(private parent: LibraryBuilder<Parent>,
        private name: string,
        private meta: CommandMeta) {

        this.library = parent.library;
    }

    help(val: string): this {
        this.meta.help = val;
        return this;
    }

    impl(val: Command): this {
        this.library.funcs[this.name].impl = val;
        return this;
    }

    callsBody(usage: CommandBodyUsage): this {
        this.meta.callsBody = usage;
        return this;
    }

    includes(): LibraryBuilder<this> {
        return new LibraryBuilder(this.meta.includes, this);
    }

    // these methods really act on the LibraryBuilder, but
    // it is annoying to call .parent.func or .parent.done
    command(name: string, patterns: string[]): CommandAdder<Parent> {
        return this.parent.command(name, patterns);
    }

    ref(name: string, val: any): LibraryBuilder<Parent> {
        return this.parent.ref(name, val);
    };

    done(): Parent {
        return this.parent.done();
    }
}

export enum CommandBodyUsage {
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

    command(name: string, patterns: string[]): CommandAdder<Parent> {
        this.library.funcs[name] = {
            meta: new CommandMeta(),
            impl: null,
            patterns: patterns
        };
        return new CommandAdder(this, name, this.library.funcs[name].meta);
    }

    ref(name: string, val: any): this {
        this.library.refs[name] = val;
        return  this;
    }
}

export class Library {
    // export these for convenience
    static ONCE = CommandBodyUsage.ONCE;
    static REPEATEDLY = CommandBodyUsage.REPEATEDLY;
    static LATER = CommandBodyUsage.LATER;

    static create(): LibraryBuilder<Library> {
        var lib = new Library();
        return new LibraryBuilder<Library>(lib, lib);
    }

    funcs: {
        [name: string]: {meta: CommandMeta, impl: Command, patterns: string[]};
    } = {};

    refs: {
        [name: string]: any
    } = {};

    addToScope(scope: Scope, funcImpls: {[name: string]: Command} = {},
        refs: {[name: string]: any} = {}) {

        for (var name in this.funcs) {
            if (!this.funcs.hasOwnProperty(name)) { continue; }

            let {impl, patterns, meta} = this.funcs[name];
            impl = funcImpls[name] || impl;

            if (impl) {
                scope.addCommand(patterns, impl, meta);
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

export class CommandMeta {
    callsBody: CommandBodyUsage;
    help: string;

    includes: Library = new Library();
}
