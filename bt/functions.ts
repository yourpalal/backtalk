/// <reference path="vars.ts"/>

'use strict';

import vars = require("vars")

// everything in this file should be pure functional
// because I want it that way

export class FuncDef {
  constructor(public bits: string[], public dyn, public vivify: vars.Vivify[]) {
  }
  isEmpty(): boolean {
    return (this.bits.length === 0 && this.dyn.length === 0);
  }
}

export class FuncDefCollection {
  constructor(public defs: FuncDef[] = null) {
  }

  static fromString(source: string): FuncDefCollection {
    var collection = new FuncDefCollection();
    return collection.process(parseFuncDef(source));
  }

  process(seq: Seq): FuncDefCollection {
    var next = this;
    seq.pieces.forEach(function(piece) {
      if (piece instanceof Choice) {
        next = next.fork(<Choice>piece);
      } else {
        next = next.concat(<SimpleFuncDefPart>piece);
      }
    });

    return next;
  }

  concatDynamic(piece: SimpleFuncDefPart): FuncDefCollection {
    var concatTo = this.defs || [new FuncDef([], [], [])];
    return new FuncDefCollection(concatTo.map((def: FuncDef) => {
      return new FuncDef(def.bits.concat(piece.bits),
        def.dyn.concat(piece.dyn).concat(piece.bits),
        (def.vivify || []).concat(piece.vivify));
    }));
  }

  concat(piece: SimpleFuncDefPart) {
    var concatTo = this.defs || [new FuncDef([], [], [])];
    return new FuncDefCollection(concatTo.map((def) => {
      return new FuncDef(def.bits.concat(piece.bits),
        def.dyn,
        (def.vivify || []).concat(piece.vivify));
    }));
  }

  join(other: FuncDefCollection) {
    return new FuncDefCollection((this.defs || []).concat(other.defs));
  }

  fork(choice: Choice) {
    var original_defs = this,
      new_defs = this;

    choice.options.forEach(function(option) {
      var next_defs = original_defs;
      option.pieces.forEach(function(piece) {
        if (piece instanceof SimpleFuncDefPart) {
          next_defs = next_defs.concatDynamic(piece);
        } else {
          // TODO: fix this
          console.log('oh no :(')
        }
      });
      new_defs = new_defs.join(next_defs);
    }, this);

    return new_defs;
  }
}

type FuncDefPart = SimpleFuncDefPart | Choice | Seq;

function parseFuncDef(pattern: string): Seq {
  var pieces = pattern.match(/<[a-zA-Z |]+>|[a-zA-Z]+|\$\!?\!?/g)
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

class Seq {
  constructor(public pieces: (Choice | SimpleFuncDefPart)[]) {
  }
}

class SimpleFuncDefPart {
  constructor(public bits: string[], public dyn: string[], public vivify: vars.Vivify[]) {
  }

  static makeVar(raw: string): SimpleFuncDefPart {
    var vivify: vars.Vivify[];

    if (raw === '$') {
      vivify = [vars.Vivify.NEVER];
    } else if (raw === '$!!') {
      vivify = [vars.Vivify.ALWAYS];
    } else if (raw === '$!') {
      vivify = [vars.Vivify.AUTO];
    }

    return new SimpleFuncDefPart(['$'], [], vivify);
  }

  static makeBare(raw: string): SimpleFuncDefPart {
    return new SimpleFuncDefPart([raw], [], [])
  }
}

class Choice {
  options: Seq[]

  constructor(raw: string) {
    var bits = raw.substr(1, raw.length - 2).split('|');
    this.options = bits.map(parseFuncDef);
  }
}
