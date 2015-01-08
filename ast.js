// for use with the PEG grammar (compiled using  http://canopy.jcoglan.com/references.html)

'use strict';

var AST = {};
module.exports = AST;

var grammar = require('./grammar');

// All AST parts (except ParseError) implement the visitor pattern with accept()
// eg. (new AST.RefNode('cool')).visit({
//          visitRefNode:function(r, msg) {
//              console.log('ref nodes are awesome!!!!');
//      }}, 'my extra argument that goes into msg');
var make_ast_node = function(name, ctor) {
    AST[name] = ctor;
    var visitName = "visit" + name;
    AST[name].prototype.accept = function(visitor) {
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift(this);
        // return (visitor[visitName] || console.log('missing', visitName, 'on', visitor)).apply(visitor, args);
        return visitor[visitName].apply(visitor, args);
    };
    AST[name].prototype.toString = function() {
        return name + ": " + JSON.stringify(this);
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


make_ast_node('AddOp', function(r) { this.right = r; });
make_ast_node('SubOp', function(r) { this.right = r; });
make_ast_node('DivideOp', function(r) { this.right = r; });
make_ast_node('MultOp', function(r) { this.right = r; });
make_ast_node('BinOpNode', function(l, o) {this.left = l; this.ops = o;});
make_ast_node('Literal', function(val) { this.val = val; });
make_ast_node('BareWord', function(bare) { this.bare = bare; });
make_ast_node('UnaryMinus', function(val) { this.val = val; });
make_ast_node('Ref', function(name) { this.name = name; });
make_ast_node('RefSet', function(name, val){this.name = name; this.val = val;});
make_ast_node('CompoundExpression', function(parts) {this.parts = parts;})

make_ast_node('FuncCall', function(name, args) {
    this.name = name;
    this.args = args;
});


AST.FuncCallMaker = function() {
    this.parts = [];
};

AST.FuncCallMaker.prototype.addPart = function(part) {
    this.parts.push(part);
};

AST.FuncCallMaker.prototype.build = function() {
    var args = [],
        name = this.parts.map(function(p) {
            var result = p.accept(AST.FuncCallMaker.NameMaker);
            if (result === "$") { args.push(p); }
            return result;
        }).join(" ");
    return new AST.FuncCall(name, args);
};

AST.FuncCallMaker.NameMaker = {
    visitBareWord: function(bare) { return bare.bare; },
    visitExpression: function() { return "$"; },
    visitRef: function() { return "$"; },
    visitLiteral: function() { return "$"; }
};

AST.Parser = function() {
    this.grammar = grammar;

    grammar.Parser.NumberLiteral = {
        isa: 'NumberLiteral',
        transform: function() { return new AST.Literal(Number(this.textValue));},
    };
    grammar.Parser.StringLiteral = {
        isa: 'StringLiteral',
        transform: function() {
            return new AST.Literal(this.elements[1].textValue);
        }
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
        }
    };

    grammar.Parser.BareNode = {
        isa: 'BareNode',
        transform: function() {
            return new AST.BareWord(this.id.textValue);
        }
    };

    grammar.Parser.CompoundNode = {
        isa: 'CompoundNode',
        transform: function() {
            var parts = this.rs.elements.map(function(x) {
                return x.ex.transform();
            });
            parts.unshift(this.ls.transform());
            return new AST.CompoundExpression(parts);
        }
    };
    grammar.Parser.FuncCallNode = {
        isa: 'FuncCallNode',
        transform: function() {
            var builder = new AST.FuncCallMaker();
            builder.addPart(this.elements[0].transform());

            this.elements[1].elements.map(function(v) {
                builder.addPart(v.transform());
            });
            return builder.build();
        }
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
