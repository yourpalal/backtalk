// for use with the PEG grammar (compiled using  http://canopy.jcoglan.com/references.html)

'use strict';

var AST = {};
module.exports = AST;

var grammar = require('./grammar');

var make_bin_op = function(name, ev) {
    AST[name] = function(left, right) {
        this.left = left; this.right = right;
    };

    AST[name].prototype.Eval = ev;
};


make_bin_op('AddOp', function(s) { return this.left.Eval() + this.right.Eval(); });
make_bin_op('SubOp', function(s) { return this.left.Eval() - this.right.Eval(); });
make_bin_op('DivideOp', function(s) { return this.left.Eval() / this.right.Eval(); });
make_bin_op('MultOp', function(s) { return this.left.Eval() * this.right.Eval(); });

AST.Literal = function(val) { this.val = val; };
AST.Literal.prototype.Eval = function(s) { return this.val; };

AST.UnaryMinus = function(val) { this.val = val; };
AST.UnaryMinus.prototype.Eval = function(s) { return -this.val; };

AST.Ref = function(name) { this.name = name; };
AST.Ref.prototype.Eval = function(scope) { return scope.get(this.name); }


AST.Parser = function() {
    this.grammar = grammar;

    grammar.Parser.NumberLiteral = {
        isa: 'NumberLiteral',
        transform: function() { return new AST.Literal(Number(this.textValue));},
    };
    grammar.Parser.StringLiteral = {
        isa: 'StringLiteral',
        transform: function() { return new AST.Literal(this.textValue); },
    };
    function make_bin_op_parser(name, ast) {
        grammar.Parser[name] = {
            isa: name,
            transform: function() {
                return new ast(this.ls.transform(), this.rs.transform());
            }
        }
    };

    make_bin_op_parser('SumNode', AST.AddOp);
    make_bin_op_parser('SubNode', AST.SubOp);
    make_bin_op_parser('ProductNode', AST.MultOp);
    make_bin_op_parser('QuotientNode', AST.DivideOp);

    grammar.Parser.ValueNode = {
        isa: 'ValueNode',
        transform: function() { return this.elements[0].transform(); },
    };
};

AST.Parser.prototype.fromSource = function(source) {
    return grammar.parse(source).transform();
};
