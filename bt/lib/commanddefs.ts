import {BaseError} from "./errors";
import {Vivify} from "./vars";
import {CommandParam, CommandParams} from './commands';

export class IllegalCommandDefError extends BaseError {
    constructor(msg: string) {
        super(msg);
    }
}


export interface CommandParameterizer {
    (passed: any[]): CommandParams;
}

export class CommandDef {
    constructor(public tokens: string[], public vivify: Vivify[], public params: CommandParam[]) {
    }

    isEmpty(): boolean {
        return (this.tokens.length === 0);
    }

    makeParameterizer(): CommandParameterizer {
        return (passed: any[]) => new CommandParams(passed, this.params);
    }
}

export class CommandDefCollection {
    constructor(public defs: CommandDef[] = null) {
    }

    static fromString(source: string): CommandDefCollection {
        var collection = new CommandDefCollection();
        return collection.process(parse(source));
    }

    process(seq: Seq): CommandDefCollection {
        var next: CommandDefCollection = this;
        seq.pieces.forEach((piece) => {
            if (piece instanceof Choice) {
                next = next.fork(<Choice>piece);
            } else {
                next = next.concat(<SimpleCommandDefPart>piece);
            }
        });

        return next;
    }

    concat(piece: SimpleCommandDefPart): CommandDefCollection {
        var concatTo = this.defs || [new CommandDef([], [], [])];
        return new CommandDefCollection(concatTo.map((def) => {
            return new CommandDef(def.tokens.concat(piece.token),
                piece.vivify === null ? def.vivify : def.vivify.concat(piece.vivify),
                piece.param === null ? def.params : def.params.concat(piece.param));
        }));
    }

    join(other: CommandDefCollection): CommandDefCollection {
        return new CommandDefCollection((this.defs || []).concat(other.defs));
    }

    fork(choice: Choice): CommandDefCollection {
        var originalDefs: CommandDefCollection = this,
            newDefs: CommandDefCollection = new CommandDefCollection();

        choice.options.forEach((bits: SimpleCommandDefPart[], i: number) => {
            var nextDefs = originalDefs;
            bits.forEach((piece) => {
                nextDefs = nextDefs.concat(piece);
            });
            if (choice.param) {
                nextDefs = nextDefs.withArg(choice.param.withValue(i));
            }
            newDefs = newDefs.join(nextDefs);
        });

        return newDefs;
    }

    withArg(param: CommandParam): CommandDefCollection {
        return new CommandDefCollection(this.defs.map(def => {
            return new CommandDef(def.tokens, def.vivify, def.params.concat(param));
        }));
    }
}

type CommandDefPart = SimpleCommandDefPart | Choice | Seq;

// COMMANDDEF_PIECE_PATTERN is a regexp that matches commanddefs
const COMMANDDEF_PIECE_PATTERN = new RegExp([
    /<[a-zA-Z |$!:]+>(:[a-zA-Z]+)?/.source,
        // <[a-zA-Z |$!]+> matches choices like this: <foo bar | baz $!:cool>
        //     this doesn't need to be perfect, as we will send it to parse() later.
        // (:[a-zA-Z]+)? matches the tag that can come after a choice
    /[a-zA-Z]+/.source,
        // [a-zA-Z]+ matches bare words
    /\$\!?\!?(:[a-zA-Z]+)?/.source,
    /:$/.source,
        // \$\!?\!? matches vars (and they can be tagged like choices)
].join("|"), "g");
const COMMANDDEF_PATTERN = new RegExp(`^(${COMMANDDEF_PIECE_PATTERN.source}|\\s*)*:?$`);


export function parse(pattern: string): Seq {
    if (pattern.match(COMMANDDEF_PATTERN) == null) {
        throw new IllegalCommandDefError("commanddef cannot be parsed");
    }
    let match = pattern.match(COMMANDDEF_PIECE_PATTERN) || [];
    let pieces = match.map((piece) => {
        if (piece.indexOf('<') == 0) {
            return new Choice(piece);
        } else if (piece.charAt(0) === '$') {
            return SimpleCommandDefPart.makeVar(piece);
        } else {
            return SimpleCommandDefPart.makeBare(piece);
        }
    });
    return new Seq(pieces);
}

export class Seq {
    constructor(public pieces: (Choice | SimpleCommandDefPart)[]) {
    }
}

export class SimpleCommandDefPart {
    constructor(public token: string, public vivify: Vivify = null, public param: CommandParam = null) {
    }

    static makeVar(raw: string): SimpleCommandDefPart {
        var names = raw.split(':'),
            varType = names[0],
            name = names.length == 2 ? names[1] : null,
            vivify: Vivify = null;

        if (varType === '$') {
            vivify = Vivify.NEVER;
        } else if (varType === '$!!') {
            vivify = Vivify.ALWAYS;
        } else if (varType === '$!') {
            vivify = Vivify.AUTO;
        }

        if (name === null) {
            return new SimpleCommandDefPart('$', vivify);
        } else {
            return new SimpleCommandDefPart('$', vivify, CommandParam.forVar(name));
        }
    }

    static makeBare(raw: string): SimpleCommandDefPart {
        return new SimpleCommandDefPart(raw);
    }
}

export class Choice {
    options: SimpleCommandDefPart[][];
    param: CommandParam;

    // raw ~ <some stuff|like this|wow>:cool
    constructor(raw: string) {
        let end = raw.lastIndexOf(">");
        let bits = raw.substr(1, end - 1).split('|');

        // check for empty part
        let emptyPart = false;
        if (bits[0] == "") {
            emptyPart = true;
            bits.shift();
        }

        // check for choice param
        this.param = null;
        if (end != raw.length && raw[end + 1] === ":") {
            let name = raw.slice(end + 2);
            this.param = CommandParam.forChoice(name);
        }

        // verify and extract the SimpleCommandDefParts
        this.options = bits.map((b: string) => {
            let s: Seq = parse(b);
            s.pieces.forEach((p) => {
                if (p instanceof Choice) {
                    throw new IllegalCommandDefError("Cannot have nested choices in function pattern");
                }
            });
            return <SimpleCommandDefPart[]>(s.pieces);
        });

        if (emptyPart) {
            this.options.unshift([]);
        }
    }
}
