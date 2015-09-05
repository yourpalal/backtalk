import {Vivify} from "./vars";
import {FuncParam, FuncParams} from './functions';

export interface FuncParameterizer {
  (passed: any[]): FuncParams
}

export class FuncDef {
  constructor(public tokens: string[], public vivify: Vivify[], public params: FuncParam[]) {
  }

  isEmpty(): boolean {
    return (this.tokens.length === 0);
  }

  makeParameterizer(): FuncParameterizer {
    return (passed: any[]) => new FuncParams(passed, this.params);
  }
}

export class FuncDefCollection {
  constructor(public defs: FuncDef[] = null) {
  }

  static fromString(source: string): FuncDefCollection {
    var collection = new FuncDefCollection();
    return collection.process(parse(source));
  }

  process(seq: Seq): FuncDefCollection {
    var next: FuncDefCollection = this;
    seq.pieces.forEach((piece) => {
      if (piece instanceof Choice) {
        next = next.fork(<Choice>piece);
      } else {
        next = next.concat(<SimpleFuncDefPart>piece);
      }
    });

    return next;
  }

  concat(piece: SimpleFuncDefPart): FuncDefCollection {
    var concatTo = this.defs || [new FuncDef([], [], [])];
    return new FuncDefCollection(concatTo.map((def) => {
      return new FuncDef(def.tokens.concat(piece.token),
        piece.vivify === null ? def.vivify : def.vivify.concat(piece.vivify),
        piece.param === null ? def.params : def.params.concat(piece.param));
    }));
  }

  join(other: FuncDefCollection): FuncDefCollection {
    return new FuncDefCollection((this.defs || []).concat(other.defs));
  }

  fork(choice: Choice): FuncDefCollection {
    var original_defs: FuncDefCollection = this,
      new_defs: FuncDefCollection = new FuncDefCollection();

    choice.options.forEach((bits: SimpleFuncDefPart[], i:number) => {
      var next_defs = original_defs;
      bits.forEach((piece) => {
        next_defs = next_defs.concat(piece);
      });
      if (choice.param) {
        next_defs = next_defs.withArg(choice.param.withValue(i));
      }
      new_defs = new_defs.join(next_defs);
    });

    return new_defs;
  }

  withArg(param: FuncParam): FuncDefCollection {
    return new FuncDefCollection(this.defs.map(def => {
      return new FuncDef(def.tokens, def.vivify, def.params.concat(param));
    }));
  }
}

type FuncDefPart = SimpleFuncDefPart | Choice | Seq;

export function parse(pattern: string): Seq {
  // regexp explanation:
  // the strategy is to match each piece that we are interested in, instead of
  // spliting via whitespace or something like that.
  //
  // <[a-zA-Z |$!]+> matches choices like this: <foo bar | baz $!:cool>
  //     this doesn't need to be perfect, as we will send it to parse() later.
  // (:[a-zA-Z]+)? matches the tag that can come after a choice
  // [a-zA-Z]+ matches bare words
  // \$\!?\!? matches vars (and they can be tagged like choices)
  // :$ matches ":" at the end of the pattern
  var pieces = pattern.match(/<[a-zA-Z |$!:]+>(:[a-zA-Z]+)?|[a-zA-Z]+|\$\!?\!?(:[a-zA-Z]+)?|\:$/g)
    .map((piece) => {
    if (piece.indexOf('<') == 0) {
      return new Choice(piece);
    } else if (piece.charAt(0) === '$') {
      return SimpleFuncDefPart.makeVar(piece);
    } else {
      return SimpleFuncDefPart.makeBare(piece);
    }
  });
  return new Seq(pieces);
};

export class Seq {
  constructor(public pieces: (Choice | SimpleFuncDefPart)[]) {
  }
}

export class SimpleFuncDefPart {
  constructor(public token: string, public vivify: Vivify = null, public param: FuncParam = null) {
  }

  static makeVar(raw: string): SimpleFuncDefPart {
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
      return new SimpleFuncDefPart('$', vivify);
    } else {
      return new SimpleFuncDefPart('$', vivify, FuncParam.forVar(name));
    }
  }

  static makeBare(raw: string): SimpleFuncDefPart {
    return new SimpleFuncDefPart(raw);
  }
}

export class Choice {
  options: SimpleFuncDefPart[][];
  param: FuncParam;

  // raw ~ <some stuff|like this|wow>:cool
  constructor(raw: string) {
    var end = raw.lastIndexOf(">");
    var bits = raw.substr(1, end - 1).split('|');

    // check for empty part
    var emptyPart = false;
    if (bits[0] == "") {
      emptyPart = true;
      bits.shift();
    }

    // check for choice param
    this.param = null;
    if (end != raw.length && raw[end + 1] === ":") {
      var name = raw.slice(end + 2);
      this.param = FuncParam.forChoice(name);
    }

    // verify and extract the SimpleFuncDefParts
    this.options = bits.map((b: string) => {
      var s: Seq = parse(b);
      s.pieces.forEach((p) => {
        if (p instanceof Choice) {
            throw new Error("Cannot have nested choices in function pattern");
        }
      });
      return <SimpleFuncDefPart[]>(s.pieces);
    });

    if (emptyPart) {
      this.options.unshift([]);
    }
  }
}
