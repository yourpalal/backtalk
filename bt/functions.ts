///<reference path="./back_talker.ts"/>

'use strict';

// everything in this file should be pure functional
// because I want it that way

var FuncDefParser : any = function() {};

FuncDefParser.FuncDef = function(bits, dynamic_bits, vivify) {
    this.bits = bits;
    this.dyn = dynamic_bits;
    this.vivify = vivify;
};

FuncDefParser.FuncDef.prototype.isEmpty = function() {
    return (this.bits.length === 0 && this.dyn.length === 0);
};


FuncDefParser.FuncDefCollection = function(defs) {
    this.defs = defs || null;
};

FuncDefParser.FuncDefCollection.fromString = function(source) {
    var collection = new FuncDefParser.FuncDefCollection();
    return collection.process(FuncDefParser.parse(source));
};

FuncDefParser.FuncDefCollection.prototype.process = function(seq) {
    var next = this;
    seq.pieces.forEach(function(piece) {
      next = next[piece.processor].call(next, piece);
    });

    return next;
};

FuncDefParser.FuncDefCollection.prototype.concatDynamic = function(piece) {
    var concatTo = this.defs || [new FuncDefParser.FuncDef([], [], [])];
    return new FuncDefParser.FuncDefCollection(concatTo.map(function(def) {
        return new FuncDefParser.FuncDef(def.bits.concat(piece.bits),
                                        def.dyn.concat(piece.dyn).concat(piece.bits),
                                        (def.vivify || []).concat(piece.vivify));
    }));
};

FuncDefParser.FuncDefCollection.prototype.concat = function(piece) {
    var concatTo = this.defs || [new FuncDefParser.FuncDef([], [])];
    return new FuncDefParser.FuncDefCollection(concatTo.map(function(def) {
        return new FuncDefParser.FuncDef(def.bits.concat(piece.bits),
                                        def.dyn,
                                        (def.vivify || []).concat(piece.vivify));
    }));
};

FuncDefParser.FuncDefCollection.prototype.join = function(other) {
  return new FuncDefParser.FuncDefCollection((this.defs || []).concat(other.defs))
};

FuncDefParser.FuncDefCollection.prototype.fork = function(choice) {
    var original_defs = this,
        new_defs = this;

    choice.options.forEach(function(option) {
        var next_defs = original_defs;
        option.pieces.forEach(function(piece) {
          next_defs = next_defs.concatDynamic(piece);
        });
        new_defs = new_defs.join(next_defs);
    }, this);

    return new_defs;
};

FuncDefParser.parse = function(pattern) {
    var pieces = pattern.match(/<[a-zA-Z |]+>|[a-zA-Z]+|\$\!?\!?/g)
        .map(function(piece) {
            if (piece.indexOf('<') == 0) {
                return new FuncDefParser.Choice(piece);
            } else if (piece.charAt(0) === '$') {
                return new FuncDefParser.Var(piece);
            } else {
                return new FuncDefParser.Bare(piece);
            }
        });
    return new FuncDefParser.Seq(pieces);
};

FuncDefParser.Seq = function(pieces) {
    this.pieces = pieces;
    this.vivify = pieces.map(function(a) { return a.vivify; });
};

FuncDefParser.Var = function(raw) {
    this.bits = ['$'];
    this.dyn = [];

    if (raw === '$')  {
      this.vivify = [BackTalker.VIVIFY.NEVER];
    } else if (raw === '$!!') {
      this.vivify = [BackTalker.VIVIFY.ALWAYS];
    } else if (raw === '$!') {
      this.vivify = [BackTalker.VIVIFY.AUTO];
    }
};

FuncDefParser.Choice = function(raw) {
    this.options = raw.substr(1, raw.length - 2).split('|');
    this.options = this.options.map(FuncDefParser.parse);
};

FuncDefParser.Bare = function(raw) {
    this.word = raw;
    this.bits = [raw];
    this.dyn = [];
    this.vivify = [];
};

FuncDefParser.Seq.prototype.processor = 'concat';
FuncDefParser.Var.prototype.processor = 'concat';
FuncDefParser.Bare.prototype.processor = 'concat';
FuncDefParser.Choice.prototype.processor = 'fork';
