// for use with the PEG grammar (compiled using  http://canopy.jcoglan.com/references.html)

'use strict';

var AST = {};
module.exports = AST;

var grammar = require('./grammar');

var make_bin_op = function(name, ev) {
    AST[name] = function(right) {
        this.right = right;
    };

    AST[name].prototype.Eval = ev;
};


make_bin_op('AddOp', function(s, left) { return left + this.right.Eval(s); });
make_bin_op('SubOp', function(s, left) { return left - this.right.Eval(s); });
make_bin_op('DivideOp', function(s, left) { return left / this.right.Eval(); });
make_bin_op('MultOp', function(s, left) { return left * this.right.Eval(); });


AST.BinOpNode = function(left, ops) {
    this.left = left;
    this.ops = ops;
}

AST.BinOpNode.prototype.Eval = function(s) {
    var left = this.left.Eval(s),
        i = 0;

    for (i = 0; i < this.ops.length; i++) {
        left = this.ops[i].Eval(s, left);
    }
    return left; 
}

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

    function make_bin_op_parser(name, ops) {
        grammar.Parser[name] = {
            isa: name,
            transform: function() {
                // example: 3+4+5+6
                // ls:3 , elements[1][0] = {op:'+',rs: '4'}
                var rights = this.elements[1].elements.map(function(v) {
                    return new (ops[v.op.textValue])(v.rs.transform());
                });

                return new AST.BinOpNode(this.ls.transform(), rights);
            }
        }
    };

    make_bin_op_parser('SumNode', {'+': AST.AddOp, '-': AST.SubOp});
    make_bin_op_parser('ProductNode', {'*': AST.MultOp, '/': AST.DivideOp});

    grammar.Parser.ParenNode = {
        isa: 'ParenNode',
        transform: function() {
            return this.ex.transform();
        },
    };
};


AST.Parser.prototype.fromSource = function(source) {
    var parse_tree = grammar.parse(source);
    // console.log(parse_tree);
    return parse_tree.transform();
};
