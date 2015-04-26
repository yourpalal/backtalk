'use strict';

// everything in this file should be pure functional
// because I want it that way

var FuncDefParser = function() {
};

FuncDefParser.FuncDef = function(bits, dynamic_bits) {
    this.bits = bits;
    this.dyn = dynamic_bits;
};

FuncDefParser.FuncDef.prototype.isEmpty = function() {
    return (this.bits.length === 0 && this.dyn.length === 0);
};


FuncDefParser.FuncDefCollection = function(defs) {
    this.defs = defs || [new FuncDefParser.FuncDef([], [])];
};

FuncDefParser.FuncDefCollection.fromString = function(source) {
    var collection = new FuncDefParser.FuncDefCollection();
    return collection.process(FuncDefParser.parse(source));
};

FuncDefParser.FuncDefCollection.prototype.process = function(seq) {
    var next = this;
    seq.pieces.forEach(function(piece) {
        console.log('processing ', piece, next);
        next = next[piece.processor].call(next, piece);
    });

    return next;
};

FuncDefParser.FuncDefCollection.prototype.concatDynamic = function(piece) {
    return new FuncDefParser.FuncDefCollection(this.defs.map(function(def) {
        return new FuncDefParser.FuncDef(def.bits.concat(piece.bits),
                                        def.dyn.concat(piece.dyn));
    }));
};

FuncDefParser.FuncDefCollection.prototype.concat = function(piece) {
    return new FuncDefParser.FuncDefCollection(this.defs.map(function(def) {
        return new FuncDefParser.FuncDef(def.bits.concat(piece.bits),
                                        def.dyn);
    }));
};

FuncDefParser.FuncDefCollection.prototype.fork = function(choice) {
    var new_defs = [];

    choice.options.forEach(function(option) {
        new_defs = new_defs.concat(this.concatDynamic(options));
    });

    return new FuncDefParser.FuncDefCollection(new_defs);
};

FuncDefParser.parse = function(pattern) {
    var pieces = pattern.split("\s+[<>]")
        .map(function(piece) {
            if (piece.indexOf('|') >= 0) {
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
};

FuncDefParser.Var = function(raw) {
    this.bits = ['$'];
    this.dyn = [];
};

FuncDefParser.Choice = function(raw) {
    this.pieces = raw.split('|').map(FuncDefParser.parse);
};

FuncDefParser.Bare = function(raw) {
    this.word = raw;
    this.bits = [raw];
    this.dyn = [];
};

FuncDefParser.Seq.prototype.processor = 'concat';
FuncDefParser.Var.prototype.processor = 'concat';
FuncDefParser.Bare.prototype.processor = 'concat';
FuncDefParser.Choice.prototype.processor = 'fork';

module.exports = FuncDefParser;
