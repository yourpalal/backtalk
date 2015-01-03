// for use with the PEG grammar (compiled using  http://canopy.jcoglan.com/references.html)

'use strict';

var AST = {};
module.exports = AST;

var grammar = require('./grammar');

// All AST parts (except ParseError) implement the visitor pattern with accept()
// eg. (new AST.RefNode('cool')).visit({
//          visitRefNode:function(r) {
//              console.log('ref nodes are awesome!!!!');
//      }});
var make_ast_node = function(name, ctor, eval_method) {
    AST[name] = ctor;
    AST[name].prototype.Eval = eval_method;
    AST[name].prototype.accept = function(visitor) {
        return (visitor["visit" + name])(this);
    };
};

AST.ParseError = function(err) {
    this.inner = err;
    this.message = "ParseError: " + err.message;
    this.stack = err.stack;
};

AST.ParseError.toString = function() {
   return this.inner.toString();
};


make_ast_node('AddOp', function(r) { this.right = r; },
        function(s, left) { return left + this.right.Eval(s); }
);

make_ast_node('SubOp', function(r) { this.right = r; },
        function(s, left) { return left - this.right.Eval(s); });

make_ast_node('DivideOp', function(r) { this.right = r; },
        function(s, left) { return left / this.right.Eval(s);});

make_ast_node('MultOp', function(r) { this.right = r; },
        function(s, left) { return left * this.right.Eval(s); });


make_ast_node('BinOpNode', function(left, ops) {
        this.left = left;
        this.ops = ops;
    },
    function(s) {
        var left = this.left.Eval(s),
            i = 0;

        for (i = 0; i < this.ops.length; i++) {
            left = this.ops[i].Eval(s, left);
        }
        return left; 
    });

make_ast_node('Literal', function(val) { this.val = val; },
                         function(s) { return this.val; });

make_ast_node('UnaryMinus', function(val) { this.val = val; },
                            function(s) { return -this.val; });

make_ast_node('Ref', function(name) { this.name = name; },
                     function(scope) { return scope.get(this.name); });

make_ast_node('RefSet',
    function(name, val) { this.name = name; this.val = val; },
    function(scope) {
        var rs = this.val.Eval(scope);
        scope.set(this.name, rs);
        return rs;
    });


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

    grammar.Parser.RefNode = {
        isa: 'RefNode',
        transform: function() {
            return new AST.Ref(this.id.textValue);
        }
    };

    grammar.Parser.RefSetNode = {
        isa: 'RefSetNode',
        transform: function() {
            return new AST.RefSet(this.ref.id.textValue,
                        this.expression.transform());
        },
    };
};


AST.Parser.prototype.fromSource = function(source) {
    var parse_tree;
    try {
        parse_tree = grammar.parse(source);
        // console.log(parse_tree);
    } catch (e) {
        throw new AST.ParseError(e);
    }
    return parse_tree.transform();
};
