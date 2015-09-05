import * as grammar from "./peg_grammar";
import * as AST from "./ast";

export = grammar;

class FuncCallNameMaker extends AST.BaseVisitor {
  visitBareWord(bare: AST.BareWord) { return bare.bare; }
  visitExpression() { return "$"; }
  visitRef() { return "$"; }
  visitLiteral() { return "$"; }
  visitFuncCall() { return "$"; }
  visitHangingCall() { return "$"; }
}

class FuncCallMaker {
  public parts: AST.Visitable[];

  constructor() {
    this.parts = [];
  }

  addPart(part: AST.Visitable) {
    this.parts.push(part)
  }

  build(): { name: string; args: AST.FuncArg[] } {
    var args: AST.FuncArg[] = [],
      name = this.parts.map((p) => {
        var result = <string>p.accept(new FuncCallNameMaker());
        if (result === "$") { args.push(new AST.FuncArg(p)); }
        return result;
      }).join(" ");
    return { name: name, args: args };
  }
}


class LineNumSetter extends AST.BaseVisitor {
  private code: AST.Code;

  constructor(num: number) {
    super();
    this.code = new AST.Code(num);
  }

  visitVisitable(v: AST.Visitable): any {
    v.code = this.code;
    v.acceptForChildren(this);
  }

  visitHangingCall(v: AST.HangingCall, ...args: any[]): any {
    v.code = this.code;
    // ignore v.body, which may not be set yet, and will be on separate lines anyway!
    v.acceptForArgs(this);
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
class Line {
  indent: number
  ex: AST.Visitable

  constructor(num: number, line: any) {
    line = line.line || line; // we may have a LineNode or a (BREAK line)
    this.indent = line.lead.textValue.length;
    this.ex = line.ex.transform();

    // recursively set line numbers
    this.ex.accept(new LineNumSetter(num));
  }
}

class LineCollector extends AST.BaseVisitor {
  // i is the index of the line we are processing
  constructor(public lines: Line[], public i: number, public indent: number) {
    super()
  }

  visitHangingCall(func: AST.HangingCall): any {
    var c = new LineCollector(this.lines, this.i + 1, this.lines[this.i].indent + 1);
    func.body = c.collect();
    this.i = c.i;
      // we start up where the other collector left off
      // (this.i is the last line they included), and in the next iteration of
      // this.collect, we will be processing the first line they did not include.
    return func;
  }

  collect(): AST.CompoundExpression {
    var parts :AST.Visitable[] = [];

    for (; this.i < this.lines.length; this.i++) {
      if (this.lines[this.i].indent < this.indent) {
        this.i--
        break;
      }

      parts.push(this.lines[this.i].ex.accept(this));
    }

    return new AST.CompoundExpression(parts);
  }

  visitVisitable(a: AST.Visitable): any { return a; }
}

module grammarParserNumberLiteral {
  export var isa = 'NumberLiteral';

  export function transform() {
    return new AST.Literal(Number(this.textValue));
  }
}
grammar.Parser.NumberLiteral = grammarParserNumberLiteral;

module grammarParserStringLiteral {
  export var isa = 'StringLiteral';

  export function transform() {
    return new AST.Literal(this.elements[1].textValue);
  }
}
grammar.Parser.StringLiteral = grammarParserStringLiteral;


function make_bin_op_parser(name, ops) {
  grammar.Parser[name] = {
    isa: name,
    transform: function() {
      // example: 3+4+5+6
      // ls:3 , elements[1][0] = {op:'+',rs: '4'}
      var rights = this.parts.elements.map((v) => {
        return new (ops[v.op.textValue])(v.rs.transform());
      });

      return new AST.BinOpNode(this.ls.transform(), rights);
    }
  }
};

make_bin_op_parser('SumNode', { '+': AST.AddOp, '-': AST.SubOp });
make_bin_op_parser('ProductNode', { '*': AST.MultOp, '/': AST.DivideOp });

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
    return new AST.Ref(this.id.textValue);
  }
}
grammar.Parser.RefNode = grammarParserRefNode;

module grammarParserBareNode {
  export var isa = 'BareNode'
  export function transform() {
    return new AST.BareWord(this.textValue);
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

    this.parts.elements.map((v) => {
      builder.addPart(v.elements[1].transform());
    });

    var callParts = builder.build();
    if (this.colon.textValue === ':') {
      return new AST.HangingCall(callParts.name + ' :', callParts.args);
    }
    return new AST.FuncCall(callParts.name, callParts.args);
  }
}
grammar.Parser.FuncCallNode = grammarParserFuncCallNode;


class SimpleParserNode implements grammar.ParserNode {
  constructor(public isa: string) { }
  transform(): any {
    console.log('throwing transform exception for: ', this);
    throw new Error("Called transform on a " + this.isa);
  }
}

grammar.Parser.LineNode = new SimpleParserNode('LineNode');
grammar.Parser.Expression = new SimpleParserNode('Expression');
grammar.Parser.Comment = new SimpleParserNode('Comment');
grammar.Parser.SPACE = new SimpleParserNode('SPACE');
