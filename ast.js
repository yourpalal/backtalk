// for use with the PEG grammar (compiled using  http://canopy.jcoglan.com/references.html)

'use strict';

var AST = {};
module.exports = AST;

var grammar = require('./grammar');

// call this on a prototype to make it into an AST visitor
// f is a constructor for the default value for your visitor methods
//     it gets the name of the thing being visited
// if f is not supplied, it will default to a no op factory
AST.makeVisitor = function(p, f) {
    f = f || function() {return function() {};};

    'HangingCall FuncCall Literal Ref RefNode RefSet Name BareWord DivideOp BinOpNode AddOp MultOp DivideOp Expression CompoundExpression'.split(" ").forEach(function(n) {
        p['visit' + n] = f(n);
    });
};


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
        visitor[visitName] || console.log("missing " + visitName);
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
make_ast_node('HangingCall', function(name, args) {
    this.name = name;
    this.args = args;
});

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

AST.FuncCallMaker.prototype.build = function(ctor) {
    var args = [],
        name = this.parts.map(function(p) {
            var result = p.accept(AST.FuncCallMaker.NameMaker);
            if (result === "$") { args.push(p); }
            return result;
        }).join(" ");
    return new ctor(name, args);
};

AST.FuncCallMaker.NameMaker = {
    visitBareWord: function(bare) { return bare.bare; },
    visitExpression: function() { return "$"; },
    visitRef: function() { return "$"; },
    visitLiteral: function() { return "$"; },
    visitFuncCall: function() { return "$"; },
    visitHangingCall: function() { return "$"; }
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
                var rights = this.parts.elements.map(function(v) {
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
            return new AST.BareWord(this.textValue);
        }
    };

    // LineCollector collects lines based on indentation into
    // AST.CompoundExpression instances. As it does this,
    // hanging calls have their body property set to a CompoundExpression
    // of the lines in their body.
    //
    // Eg.
    // wow:
    //   this is cool
    //   yeah neat
    //
    // will go from
    // CompoundExpression
    //   HangingCall
    //   FuncCall
    //   FuncCall
    //
    // to 
    // CompoundExpression
    //   HangingCall
    //     CompoundExpression
    //       FuncCall
    //       FuncCall
    //
    // LineCollector works by going through the lines of a compound expression
    // using the visitor pattern to recognize hanging calls. If a hanging call
    // is found, it makes a new LineCollector to collect lines for that call.
    //
    // Useful insight: the stack of LineCollectors creating each other will
    // mirror the call stack of the program when it is run.
    function LineCollector(lines, start, indent) {
        this.lines = lines;
        this.i = start;
        this.indent = indent;
    };

    LineCollector.makeLinePart = function(line) {
        line = line.line || line; // we may have a LineNode or a (BREAK line)
        return {
            indent: line.lead.textValue.length,
            ex: line.ex.transform()
        };
    };

    AST.makeVisitor(LineCollector.prototype, function(name) {
        // for most things we just want the AST node
        return function(a) { return a; };
    });

    LineCollector.prototype.visitHangingCall = function(func) {
        var c = new LineCollector(this.lines, this.i + 1, this.lines[this.i].indent);
        func.body = c.collect();

        this.i = c.i - 1;
            // we start up where the other collector left off
            // c.i - 1 because the for loop will increment i momentarily
        return func;
    };

    LineCollector.prototype.collect = function() {
        var parts = [];

        for (; this.i < this.lines.length; this.i++) {
            if (this.lines[this.i].indent < this.indent) {
                break;
            }

            parts.push(this.lines[this.i].ex.accept(this));
        }

        return new AST.CompoundExpression(parts);
    };

    grammar.Parser.CompoundNode = {
        isa: 'CompoundNode',
        transform: function() {
            var lines = this.rs.elements.map(LineCollector.makeLinePart);
            lines.unshift(LineCollector.makeLinePart(this.ls));

            var collector = new LineCollector(lines, 0, 0);
            return collector.collect();
        }
    };
    grammar.Parser.FuncCallNode = {
        isa: 'FuncCallNode',
        transform: function() {
            var builder = new AST.FuncCallMaker();
            builder.addPart(this.elements[0].transform());

            this.parts.elements.map(function(v) {
                builder.addPart(v.elements[1].transform());
            });

            if (this.colon.textValue === ':') {
                return builder.build(AST.HangingCall);
            }
            return builder.build(AST.FuncCall);
        }
    };

    'LineNode Expression ProdQuoNode Comment SPACE ArithValueNode'.split(" ").forEach(function(v) {
        grammar.Parser[v] = {isa: v};
    });
};


AST.Parser.prototype.fromSource = function(source, inspector) {
    var parse_tree;
    try {
        parse_tree = grammar.parse(source.trim());
        if (inspector) {
            inspector(parse_tree);
        }
    } catch (e) {
        throw new AST.ParseError(e);
    }
    return parse_tree.transform();
};
