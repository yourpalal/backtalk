/// <reference path="back_talker.ts" />
/// <reference path="grammar.d.ts"/>

// for use with the PEG grammar (compiled using  http://canopy.jcoglan.com/references.html)

// TODO: this breaks things :'(
// import grammar = require('grammar');

module BackTalker {

  export function parse(source, inspector) {
    this._parser = this._parser || new Syntax.Parser();
    return this._parser.fromSource(source, inspector);
  }

  export module Syntax {
    export class ParseError {
      public inner: any
      public message: string
      public stack: any

      constructor(err) {
        this.inner = err;
        this.message = "ParseError: " + err.message;
        this.stack = err.stack;
      }

      toString() {
        return this.inner.toString();
      }
    }

    export interface Visitor {
      visitAddOp(AddOp): any;
      visitSubOp(SubOp): any;
      visitDivideOp(DivideOp): any;
      visitMultOp(MultOp): any;
      visitBinOpNode(BinOpNode): any;
      visitLiteral(Literal): any;
      visitBareWord(BareWord): any;
      visitUnaryMinus(UnaryMinus): any;
      visitRef(Ref): any;
      visitCompoundExpression(CompoundExpression): any;
      visitHangingCall(HangingCall): any;
      visitFuncCall(FuncCall): any;
    }

    export class BaseVisitor implements Visitor {
      visitAddOp(AddOp): any { throw new Error("visitAddOp not implemented"); }
      visitSubOp(SubOp): any { throw new Error("visitSubOp not implemented"); }
      visitDivideOp(DivideOp): any { throw new Error("visitDivideOp not implemented"); }
      visitMultOp(MultOp): any { throw new Error("visitMultOp not implemented"); }
      visitBinOpNode(BinOpNode): any { throw new Error("visitBinOpNode not implemented"); }
      visitLiteral(Literal): any { throw new Error("visitLiteral not implemented"); }
      visitBareWord(BareWord): any { throw new Error("visitBareWord not implemented"); }
      visitUnaryMinus(UnaryMinus): any { throw new Error("visitUnaryMinus not implemented"); }
      visitRef(Ref): any { throw new Error("visitRef not implemented"); }
      visitCompoundExpression(CompoundExpression): any { throw new Error("visitCompoundExpression not implemented"); }
      visitHangingCall(HangingCall): any { throw new Error("visitHangingCall not implemented"); }
      visitFuncCall(FuncCall): any { throw new Error("visitFuncCall not implemented"); }
    }

    export interface Visitable {
      accept(Visitor): any
    }

    export class AddOp implements Visitable {
      constructor(public right: any) { }
      accept(visitor: Visitor): any { return visitor.visitAddOp(this); }
    }

    export class SubOp implements Visitable {
      constructor(public right: any) { }
      accept(visitor: Visitor): any { return visitor.visitSubOp(this); }
    }

    export class DivideOp implements Visitable {
      constructor(public right: any) { }
      accept(visitor: Visitor): any { return visitor.visitDivideOp(this); }
    }

    export class MultOp implements Visitable {
      constructor(public right: any) { }
      accept(visitor: Visitor): any { return visitor.visitMultOp(this); }
    }

    export class BinOpNode implements Visitable {
      constructor(public left: any, public ops: any) { }
      accept(visitor: Visitor): any { return visitor.visitBinOpNode(this); }
    }

    export class Literal implements Visitable {
      constructor(public val: any) { }
      accept(visitor: Visitor): any { return visitor.visitLiteral(this); }
    }

    export class BareWord implements Visitable {
      constructor(public val: any) { }
      accept(visitor: Visitor): any { return visitor.visitBareWord(this); }
    }

    export class UnaryMinus implements Visitable {
      constructor(public val: any) { }
      accept(visitor: Visitor): any { return visitor.visitUnaryMinus(this); }
    }

    export class Ref implements Visitable {
      constructor(public name: any) { }
      accept(visitor: Visitor): any { return visitor.visitRef(this); }
    }

    export class CompoundExpression implements Visitable {
      constructor(public parts: any) { }
      accept(visitor: Visitor): any { return visitor.visitCompoundExpression(this); }
    }

    export class HangingCall implements Visitable {
      public body: CompoundExpression;

      constructor(public name: any, public args: any) { }
      accept(visitor: Visitor): any { return visitor.visitHangingCall(this); }
    }

    export class FuncCall implements Visitable {
      constructor(public name: any, public args: any) { }
      accept(visitor: Visitor): any { return visitor.visitFuncCall(this); }
    }

    export class FuncCallNameMaker extends BaseVisitor {
      visitBareWord(bare) { return bare.bare; }
      visitExpression() { return "$"; }
      visitRef() { return "$"; }
      visitLiteral() { return "$"; }
      visitFuncCall() { return "$"; }
      visitHangingCall() { return "$"; }
    }

    export class FuncCallMaker {
      public parts: any;

      constructor() {
        this.parts = [];
      }

      addPart(part) {
        this.parts.push(part)
      }

      build(ctor) {
        var args = [],
          name = this.parts.map(function(p) {
            var result = p.accept(new FuncCallNameMaker());
            if (result === "$") { args.push(p); }
            return result;
          }).join(" ");
        return new ctor(name, args);
      }
    }

    export class Parser {
      fromSource = function(source: string, inspector) {
        var parse_tree;
        try {
          parse_tree = grammar.parse(source.trim());
          if (inspector) {
            inspector(parse_tree);
          }
        } catch (e) {
          throw new ParseError(e);
        }
        return parse_tree.transform();
      };

      constructor() {
        grammar.Parser.NumberLiteral = {
          isa: 'NumberLiteral',
          transform: function() { return new Literal(Number(this.textValue)); },
        };

        grammar.Parser.StringLiteral = {
          isa: 'StringLiteral',
          transform: function() {
            return new Literal(this.elements[1].textValue);
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

              return new BinOpNode(this.ls.transform(), rights);
            }
          }
        };

        make_bin_op_parser('SumNode', { '+': AddOp, '-': SubOp });
        make_bin_op_parser('ProductNode', { '*': MultOp, '/': DivideOp });

        grammar.Parser.ParenNode = {
          isa: 'ParenNode',
          transform: function() {
            return this.ex.transform();
          },
        };

        grammar.Parser.RefNode = {
          isa: 'RefNode',
          transform: function() {
            return new Ref(this.id.textValue);
          }
        };

        grammar.Parser.BareNode = {
          isa: 'BareNode',
          transform: function() {
            return new BareWord(this.textValue);
          }
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
            var builder = new FuncCallMaker();
            builder.addPart(this.elements[0].transform());

            this.parts.elements.map(function(v) {
              builder.addPart(v.elements[1].transform());
            });

            if (this.colon.textValue === ':') {
              return builder.build(HangingCall);
            }
            return builder.build(FuncCall);
          }
        };

        'LineNode Expression ProdQuoNode Comment SPACE ArithValueNode'.split(" ").forEach(function(v) {
          grammar.Parser[v] = { isa: v };
        });
      }
    }

    // LineCollector collects lines based on indentation into
    // Syntax.CompoundExpression instances. As it does this,
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
    export class LineCollector extends BaseVisitor {
      private i: number = 0

      constructor(public lines: any, public start: number, public indent: any) {
        super()
      }

      static makeLinePart(line) {
        line = line.line || line; // we may have a LineNode or a (BREAK line)
        return {
          indent: line.lead.textValue.length,
          ex: line.ex.transform()
        };
      }

      visitHangingCall(func: HangingCall): any {
        var c = new LineCollector(this.lines, this.i + 1, this.lines[this.i].indent);
        func.body = c.collect();

        this.i = c.i - 1;
        // we start up where the other collector left off
        // c.i - 1 because the for loop will increment i momentarily
        return func;
      }

      collect(): CompoundExpression {
        var parts = [];

        for (; this.i < this.lines.length; this.i++) {
          if (this.lines[this.i].indent < this.indent) {
            break;
          }

          parts.push(this.lines[this.i].ex.accept(this));
        }

        return new CompoundExpression(parts);
      }

      visitAddOp(a: AddOp): any { return a; }
      visitSubOp(a: SubOp): any { return a; }
      visitDivideOp(a: DivideOp): any { return a; }
      visitMultOp(a: MultOp): any { return a; }
      visitBinOpNode(a: BinOpNode): any { return a; }
      visitLiteral(a: Literal): any { return a; }
      visitBareWord(a: BareWord): any { return a; }
      visitUnaryMinus(a: UnaryMinus): any { return a; }
      visitRef(a: Ref): any { return a; }
      visitCompoundExpression(a: CompoundExpression): any { return a; }
      visitFuncCall(a: FuncCall): any { return a; }
    }

  }
}
console.log(BackTalker.Syntax.BaseVisitor.prototype);
