'use strict';

import * as vars from "./vars";
import {BadTypeError} from "./errors";

// everything in this file should be pure functional
// because I want it that way

export class FuncParams {
  named: { [key: string]: any }

  constructor(public passed: any[], params: FuncParam[]) {
    this.named = {};
    if (params === null) {
      return
    }

    // impure, but convenient
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
}

export module FuncParam{
  export function forVar(name: string) {
    return new FuncParam(name, null, true);
  }

  export function forChoice(name: string) {
    return new FuncParam(name, 0, false);
  }
}

export class FuncDef {
  constructor(public bits: string[], public vivify: vars.Vivify[], public params: FuncParam[]) {
  }

  isEmpty(): boolean {
    return (this.bits.length === 0);
  }

  makeParameterizer() {
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
      return new FuncDef(def.bits.concat(piece.bits),
        def.vivify.concat(piece.vivify),
        piece.param ? def.params.concat(piece.param) : def.params);
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
      return new FuncDef(def.bits, def.vivify, def.params.concat(param));
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
  var pieces = pattern.match(/<[a-zA-Z |$!:]+>(:[a-zA-Z]+)?|[a-zA-Z]+|\$\!?\!?(:[a-zA-Z]+)?/g)
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
  constructor(public bits: string[], public vivify: vars.Vivify[], public param?: FuncParam) {
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
      return new SimpleFuncDefPart(['$'], vivify, FuncParam.forVar(name));
    }
  }

  static makeBare(raw: string): SimpleFuncDefPart {
    return new SimpleFuncDefPart([raw], [])
  }

  static makeEmpty(): SimpleFuncDefPart {
    return new SimpleFuncDefPart([], []);
  }
}

export class Choice {
  options: SimpleFuncDefPart[][];
  param: FuncParam;

  // raw ~ <some stuff|like this|wow>:cool
  constructor(raw: string) {
    var end = raw.lastIndexOf(">");
    var bits = raw.substr(1, end).split('|');

    // check for empty part
    var emptyPart = null;
    if (bits[0] == "") {
      emptyPart = SimpleFuncDefPart.makeEmpty();
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

    if (emptyPart !== null) {
      this.options.unshift([emptyPart]);
    }
  }
}
