// for use with the PEG grammar (compiled using  http://canopy.jcoglan.com/references.html)
import * as grammar from "./grammar";

import {BaseError} from "./errors";

var _parser: Parser = null;

/** @module syntax */

/** @function syntax.parse
 * @param {string} source - the backtalk source code to parse.
 * @param [inspector] - optional funciton which is called with the raw Canopy AST
 * before it's turnd into a backtalk AST.
 */
export function parse(source: string, inspector?: (p: grammar.ParserNode) => void) {
  _parser = _parser || new Parser();
  return _parser.fromSource(source, inspector);
}

export class ParseError extends BaseError {
  public inner: any

  constructor(err) {
    super(`ParseError: ${err.message}`);
    this.inner = err;
  }

  toString() {
    return this.inner;
  }
}

export interface Visitor {
  visitAddOp(v: AddOp, ...args: any[]): any;
  visitSubOp(v: SubOp, ...args: any[]): any;
  visitDivideOp(v: DivideOp, ...args: any[]): any;
  visitMultOp(v: MultOp, ...args: any[]): any;
  visitBinOpNode(v: BinOpNode, ...args: any[]): any;
  visitLiteral(v: Literal, ...args: any[]): any;
  visitBareWord(v: BareWord, ...args: any[]): any;
  visitUnaryMinus(v: UnaryMinus, ...args: any[]): any;
  visitRef(v: Ref, ...args: any[]): any;
  visitCompoundExpression(v: CompoundExpression, ...args: any[]): any;
  visitFuncArg(v: FuncArg, ...args: any[]): any;
  visitHangingCall(v: HangingCall, ...args: any[]): any;
  visitFuncCall(v: FuncCall, ...args: any[]): any;
}

export class BaseVisitor implements Visitor {
  visitAddOp(v: AddOp, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitSubOp(v: SubOp, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitDivideOp(v: DivideOp, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitMultOp(v: MultOp, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitBinOpNode(v: BinOpNode, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitLiteral(v: Literal, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitBareWord(v: BareWord, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitUnaryMinus(v: UnaryMinus, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitRef(v: Ref, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitFuncArg(v: FuncArg, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitCompoundExpression(v: CompoundExpression, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitHangingCall(v: HangingCall, ...args: any[]): any { return this.visitVisitable(v, ...args); }
  visitFuncCall(v: FuncCall, ...args: any[]): any { return this.visitVisitable(v, ...args); }

  protected visitVisitable(v: Visitable, ...args: any[]): any {
    throw new Error(`visit ${v.constructor['name']} not implemented`);
  }
}

export class Code {
  constructor(public lineNumber: number = -1, public chunk: string = "unnamed") {}

  atLine(line: number): Code {
    return new Code(line);
  }
}

export interface Visitable {
  accept(v: Visitor, ...args: any[]): any
  acceptForChildren(v: Visitor, ...args: any[]): any
  code: Code;
}

class ASTItem {
  public code: Code = null;
}

export class AddOp extends ASTItem implements Visitable {
  constructor(public right: BinOp) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitAddOp.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {
    return this.right.accept(v, ...args);
  }
}

export class SubOp extends ASTItem implements Visitable {
  constructor(public right: BinOp) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitSubOp.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {
    return this.right.accept(v, ...args);
  }
}

export class DivideOp extends ASTItem implements Visitable {
  constructor(public right: BinOp) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitDivideOp.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {
    return this.right.accept(v, ...args);
  }
}

export class MultOp extends ASTItem implements Visitable {
  constructor(public right: BinOp) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitMultOp.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {
    return this.right.accept(v, ...args);
  }
}

type BinOp = AddOp | SubOp | DivideOp | MultOp;

export class BinOpNode extends ASTItem implements Visitable {
  constructor(public left: any, public ops: BinOp[]) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitBinOpNode.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {
    this.left.accept(v, ...args);
    this.ops.forEach((op) => op.accept(v, ...args));
  }
}

export class Literal extends ASTItem implements Visitable {
  constructor(public val: string|number) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitLiteral.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {}
}

export class BareWord extends ASTItem implements Visitable {
  constructor(public bare: string) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitBareWord.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {}
}

export class UnaryMinus extends ASTItem implements Visitable {
  constructor(public val: Visitable) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitUnaryMinus.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {
    return this.val.accept(v, ...args);
  }
}

export class Ref extends ASTItem implements Visitable {
  constructor(public name: any) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitRef.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {}
}

export class CompoundExpression extends ASTItem implements Visitable {
  constructor(public parts: Visitable[]) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitCompoundExpression.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {
    this.parts.forEach((part) => part.accept(v, ...args));
  }
}

export class FuncArg extends ASTItem implements Visitable {
  constructor(public body: Visitable) { super(); }

  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitFuncArg.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {
    this.body.accept(v, ...args);
  }
}

export class HangingCall extends ASTItem implements Visitable {
  public body: CompoundExpression;

  constructor(public name: string, public args: FuncArg[]) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitHangingCall.apply(visitor, [this].concat(args));
  }

  acceptForArgs(v: Visitor, ...args: any[]): any {
    this.args.forEach((arg) => arg.accept(v, ...args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {
    this.acceptForArgs(v, ...args);
    this.body.accept(v, ...args);
  }
}

export class FuncCall extends ASTItem implements Visitable {
  constructor(public name: string, public args: FuncArg[]) { super(); }
  accept(visitor: Visitor, ...args: any[]): any {
    return visitor.visitFuncCall.apply(visitor, [this].concat(args));
  }

  acceptForChildren(v: Visitor, ...args: any[]): any {
    this.args.forEach((arg) => arg.accept(v, ...args));
  }
}

class FuncCallNameMaker extends BaseVisitor {
  visitBareWord(bare: BareWord) { return bare.bare; }
  visitExpression() { return "$"; }
  visitRef() { return "$"; }
  visitLiteral() { return "$"; }
  visitFuncCall() { return "$"; }
  visitHangingCall() { return "$"; }
}

export class FuncCallMaker {
  public parts: Visitable[];

  constructor() {
    this.parts = [];
  }

  addPart(part: Visitable) {
    this.parts.push(part)
  }

  build(): { name: string; args: FuncArg[] } {
    var args: FuncArg[] = [],
      name = this.parts.map(function(p) {
        var result = <string>p.accept(new FuncCallNameMaker());
        if (result === "$") { args.push(new FuncArg(p)); }
        return result;
      }).join(" ");
    return { name: name, args: args };
  }
}

export class Parser {
  fromSource = function(source: string, inspector?: (p: grammar.ParserNode) => void) {
    var parse_tree;
      try {
        parse_tree = grammar.parse(source);
      } catch (e) {
        throw new ParseError(e);
      }
      if (inspector) {
        inspector(parse_tree);
      }
    return <Visitable>parse_tree.transform();
  };
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
class LineNumSetter extends BaseVisitor {
  private code: Code;

  constructor(num: number) {
    super();
    this.code = new Code(num);
  }

  visitVisitable(v: Visitable): any {
    v.code = this.code;
    v.acceptForChildren(this);
  }

  visitHangingCall(v: HangingCall, ...args: any[]): any {
    v.code = this.code;
    // ignore v.body, which may not be set yet, and will be on separate lines anyway!
    v.acceptForArgs(this);
  }
}

class Line {
  indent: number
  ex: Visitable

  constructor(num: number, line: any) {
    line = line.line || line; // we may have a LineNode or a (BREAK line)
    this.indent = line.lead.textValue.length;
    this.ex = line.ex.transform();

    // recursively set line numbers
    this.ex.accept(new LineNumSetter(num));
  }
}

export class LineCollector extends BaseVisitor {
  // i is the index of the line we are processing
  constructor(public lines: Line[], public i: number, public indent: number) {
    super()
  }

  visitHangingCall(func: HangingCall): any {
    var c = new LineCollector(this.lines, this.i + 1, this.lines[this.i].indent + 1);
    func.body = c.collect();
    this.i = c.i;
      // we start up where the other collector left off
      // (this.i is the last line they included), and in the next iteration of
      // this.collect, we will be processing the first line they did not include.
    return func;
  }

  collect(): CompoundExpression {
    var parts :Visitable[] = [];

    for (; this.i < this.lines.length; this.i++) {
      if (this.lines[this.i].indent < this.indent) {
        this.i--
        break;
      }

      parts.push(this.lines[this.i].ex.accept(this));
    }

    return new CompoundExpression(parts);
  }

  visitVisitable(a: Visitable): any { return a; }
}

// merge in our stuff
module grammarParserNumberLiteral {
  export var isa = 'NumberLiteral';

  export function transform() {
    return new Literal(Number(this.textValue));
  }
}
grammar.Parser.NumberLiteral = grammarParserNumberLiteral;

module grammarParserStringLiteral {
  export var isa = 'StringLiteral';

  export function transform() {
    return new Literal(this.elements[1].textValue);
  }
}
grammar.Parser.StringLiteral = grammarParserStringLiteral;


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

module grammarParserParenNode {
  export var isa = 'ParenNode'
  export function transform() {
    return this.ex.transform();
  }
}
grammar.Parser.ParenNode = grammarParserParenNode;


module grammarParserRefNode {
  export var isa = 'RefNode'
  export function transform() {
    return new Ref(this.id.textValue);
  }
}
grammar.Parser.RefNode = grammarParserRefNode;

module grammarParserBareNode {
  export var isa = 'BareNode'
  export function transform() {
    return new BareWord(this.textValue);
  }
};
grammar.Parser.BareNode = grammarParserBareNode;

module grammarParserCompoundNode {
  export var isa = 'CompoundNode'
  export function transform() {
    // line numbering: starts from 1
    // the first line is from this.ls, second and up are from this.rs
    var lineNum = 1 + this.blanks.elements.length;
    var lines : Line[] = this.rs.elements.map((line) => {
      lineNum += line.blanks.elements.length;
      return new Line(lineNum, line);
    });
    lines.unshift(new Line(1 + this.blanks.elements.length, this.ls));

    var collector = new LineCollector(lines, 0, 0);
    return collector.collect();
  }
}
grammar.Parser.CompoundNode = grammarParserCompoundNode;

module grammarParserFuncCallNode {
  export var isa = 'FuncCallNode'
  export function transform() {
    var builder = new FuncCallMaker();

    builder.addPart(this.elements[0].transform());

    this.parts.elements.map(function(v) {
      builder.addPart(v.elements[1].transform());
    });

    var callParts = builder.build();
    if (this.colon.textValue === ':') {
      return new HangingCall(callParts.name, callParts.args);
    }
    return new FuncCall(callParts.name, callParts.args);
  }
}
grammar.Parser.FuncCallNode = grammarParserFuncCallNode;


class SimpleParserNode implements grammar.ParserNode {
  constructor(public isa: string) { }
  transform(): any {
    console.log('throwing transform exception for: ', this);
    throw new Error("Caled transform on a " + this.isa);
  }
}

grammar.Parser.LineNode = new SimpleParserNode('LineNode');
grammar.Parser.Expression = new SimpleParserNode('Expression');
grammar.Parser.Comment = new SimpleParserNode('Comment');
grammar.Parser.SPACE = new SimpleParserNode('SPACE');
