'use strict';

import vars = require("./vars")

// everything in this file should be pure functional
// because I want it that way

export class FuncParams {
  named: { [key: string]: any }

  constructor(public passed: any[], args: FuncArg[]) {
    this.named = {};
    if (args === null) {
      return
    }

    // impure, but convenient
    var param = 0;
    args.forEach((arg) => {
      if (arg.fromVar) {
        this.named[arg.name] = passed[param];
        param++;
      } else {
        this.named[arg.name] = arg.value;
      }
    });
  }

  has(name: string): boolean {
    if (this.named.hasOwnProperty(name)) {
      return true;
    }
    return false;
  }

  get(name :string, missing?: any): any {
    if (this.has(name)) {
      return this.named[name];
    }
    return missing;
  }

  choose<T>(name :string, values:T[], missing?: T) :T {
    if (this.has(name)) {
      return values[this.named[name]];
    }
    return missing;
  }
}

class FuncArg {
    constructor(public name: string, public value: any, public fromVar: boolean) {
    }

    withValue(value: any): FuncArg {
      return new FuncArg(this.name, value, this.fromVar);
    }
}

module FuncArg {
  export function forVar(name: string) {
    return new FuncArg(name, null, true);
  }

  export function forChoice(name: string) {
    return new FuncArg(name, 0, false);
  }
}

export class FuncDef {
  constructor(public bits: string[], public vivify: vars.Vivify[], public args: FuncArg[]) {
    args.forEach((arg, i) => {
      if (typeof arg === 'undefined') {
        throw new Error('undefined arg: ' + i);
      }
    });
  }

  isEmpty(): boolean {
    return (this.bits.length === 0);
  }

  makeParameterizer() {
    var args = this.args;
    return function(passed: any[]) {
      return new FuncParams(passed, args);
    };
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
      return new FuncDef(def.bits.concat(piece.bits),
        def.vivify.concat(piece.vivify),
        piece.arg ? def.args.concat(piece.arg) : def.args);
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
      if (choice.arg) {
        next_defs = next_defs.withArg(choice.arg.withValue(i));
      }
      new_defs = new_defs.join(next_defs);
    });

    return new_defs;
  }

  withArg(arg: FuncArg): FuncDefCollection {
    return new FuncDefCollection(this.defs.map(def => {
      return new FuncDef(def.bits, def.vivify, def.args.concat(arg));
    }));
  }
}

type FuncDefPart = SimpleFuncDefPart | Choice | Seq;

export function parse(pattern: string): Seq {
  var pieces = pattern.match(/<[a-zA-Z |]+>(:[a-zA-Z]+)?|[a-zA-Z]+|\$\!?\!?(:[a-zA-Z]+)?/g)
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
  constructor(public bits: string[], public vivify: vars.Vivify[], public arg?: FuncArg) {
  }

  static makeVar(raw: string): SimpleFuncDefPart {
    var names = raw.split(':'),
      varType = names[0],
      name = names.length == 2 ? names[1] : null,
      vivify: vars.Vivify[];

    if (varType === '$') {
      vivify = [vars.Vivify.NEVER];
    } else if (varType === '$!!') {
      vivify = [vars.Vivify.ALWAYS];
    } else if (varType === '$!') {
      vivify = [vars.Vivify.AUTO];
    }

    if (name === null) {
      return new SimpleFuncDefPart(['$'], vivify);
    } else {
      return new SimpleFuncDefPart(['$'], vivify, FuncArg.forVar(name));
    }
  }

  static makeBare(raw: string): SimpleFuncDefPart {
    return new SimpleFuncDefPart([raw], [])
  }
}

export class Choice {
  options: SimpleFuncDefPart[][];
  arg: FuncArg;

  // raw ~ <some stuff|like this|wow>:cool
  constructor(raw: string) {
    var end = raw.lastIndexOf(">");
    var bits = raw.substr(1, end).split('|');
    var sequences = bits.map(parse);

    this.arg = null;
    if (end != raw.length && raw[end + 1] === ":") {
      var name = raw.slice(end + 2);
      this.arg = FuncArg.forChoice(name);
    }

    // verify and extract the SimpleFuncDefParts
    this.options = sequences.map((s: Seq) => {
      s.pieces.forEach((p) => {
        if (p instanceof Choice) {
            throw new Error("Cannot have nested choices in function pattern");
        }
      });
      return <SimpleFuncDefPart[]>(s.pieces);
    });
  }
}
