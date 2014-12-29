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

    function bin_op_rs(ast, ls, rights, i) {
        if (i >= rights.length) {
            return ls.transform();
        }
        var op = rights[i].op.textValue
            ,rs = rights[i].rs
        ;
        return new (ast[op])(ls.transform(), bin_op_rs(ast, rs, rights, i + 1));
    };

    function make_bin_op_parser(name, ast) {
        grammar.Parser[name] = {
            isa: name,
            transform: function() {
                // example: 3+4+5+6
                // ls:3 , elements[1][0] = {op:'+',rs: '4'}
                return bin_op_rs(ast, this.ls, this.elements[1].elements, 0);
            }
        }
    };

    make_bin_op_parser('SumNode', {'+': AST.AddOp, '-': AST.SubOp});
    make_bin_op_parser('ProductNode', {'*': AST.MultOp, '/': AST.DivideOp});

    grammar.Parser.ValueNode = {
        isa: 'ValueNode',
        transform: function() { return this.elements[0].transform(); },
    };
};

AST.Parser.prototype.fromSource = function(source) {
    var parse_tree = grammar.parse(source);
    // console.log(parse_tree);
    return parse_tree.transform();
};
