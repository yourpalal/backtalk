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


AST.fromSource = function(source) {
    grammar.Parser.NumberLiteral = {
        isa: 'NumberLiteral',
        transform: function() { return new AST.Literal(Number(this.textValue));},
        eval: function() { return Number(this.textValue); }
    };
    grammar.Parser.StringLiteral = {
        isa: 'StringLiteral',
        transform: function() { return new AST.Literal(this.textValue); },
        eval: function() { return this.elements[1].textValue; }
    };
    grammar.Parser.SumNode = {
        isa: 'SumNode',
        transform: function() {
            return new AST.AddOp(this.ls.transform(), this.rs.transform());
        },
        eval: function() {
            if (this.rs.textValue === '') {
                return this.ls.eval();
            } else {
                return this.ls.eval() + this.rs.eval();
            }
        }
    };
    grammar.Parser.ProductNode = {
        isa: 'ProductNode',
        transform: function() {
            return new AST.MultOp(this.ls.transform(), this.rs.transform());
        },
        eval: function() {
            if (this.rs.textValue === '') {
                return this.ls.eval();
            }
        }
    };

    grammar.Parser.ValueNode = {
        isa: 'ValueNode',
        transform: function() { return this.elements[0].transform(); },
        eval: function() { return this.elements[0].eval(); }
    }

    return grammar.parse(source);
};
