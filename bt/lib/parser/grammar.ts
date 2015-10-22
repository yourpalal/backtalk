import * as AST from "./ast";
import {MissingBodyError} from "./parser";
import {ParserNode} from "./peg_grammar";

class FuncCallNameMaker extends AST.BaseVisitor {
    visitBareWord(bare: AST.BareWord) { return bare.bare; }
    visitExpression() { return "$"; }
    visitRef() { return "$"; }
    visitLiteral() { return "$"; }
    visitFuncCall() { return "$"; }
    visitHangingCall() { return "$"; }
    visitBinOpNode() { return "$"; }
}

class FuncCallMaker {
    public parts: AST.Visitable[];

    constructor() {
        this.parts = [];
    }

    addPart(part: AST.Visitable) {
        this.parts.push(part);
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
    indent: number;
    ex: AST.Visitable;

    constructor(num: number, line: any) {
        let {lead, ex} = line;
        this.indent = lead.text.length;
        this.ex = ex;

        // recursively set line numbers
        this.ex.accept(new LineNumSetter(num));
    }
}

class LineCollector extends AST.BaseVisitor {
    // i is the index of the line we are processing
    constructor(public lines: Line[], public i: number, public indent: number) {
        super();
    }

    visitHangingCall(func: AST.HangingCall): any {
        var c = new LineCollector(this.lines, this.i + 1, this.lines[this.i].indent + 1);
        func.body = c.collect();
        if (func.body.parts.length == 0) {
            throw new MissingBodyError(func.code);
        }

        this.i = c.i;
        // we start up where the other collector left off
        // (this.i is the last line they included), and in the next iteration of
        // this.collect, we will be processing the first line they did not include.
        return func;
    }

    collect(): AST.CompoundExpression {
        var parts: AST.Visitable[] = [];

        for (; this.i < this.lines.length; this.i++) {
            if (this.lines[this.i].indent < this.indent) {
                this.i--;
                break;
            }

            parts.push(this.lines[this.i].ex.accept(this));
        }

        return new AST.CompoundExpression(parts);
    }

    visitVisitable(a: AST.Visitable): any { return a; }
}

export type ParseResult = ParserNode<AST.Visitable>|AST.Visitable;

export module grammarActions {
    export function makeBool(input: string, start: number, end: number, elements: ParseResult[]) {
        if (input[start] == "t") {
            return new AST.Literal(true);
        }
        return new AST.Literal(false);
    }

    export function makeNumber(input: string, start: number, end: number, elements: AST.Visitable[]) {
        return new AST.Literal(Number(input.substring(start, end)));
    }

    export function makeString(input: string, start: number, end: number, elements: AST.Visitable[]) {
        // +-1 for quotes
        return new AST.Literal(input.substring(start + 1, end - 1));
    }

    export function makeParenNode(input: string, start: number, end: number, elements: AST.Visitable[]) {
        return elements[2]; // skip ( and spaces
    }

    export function makeBinOpNode(input: string, start: number, end: number, elements: ParseResult[]) {
        let ls = elements[0] as AST.Visitable;
        let parts = elements[1] as ParserNode<any>;

        let rs = parts.elements.map((p) => makeBinOp(p.op.text, p.rs));
        return new AST.BinOpNode(ls, rs);
    }

    const BIN_OPS = {
        '+': AST.AddOp,
        '-': AST.SubOp,
        '/': AST.DivideOp,
        '*': AST.MultOp
    };

    export function makeBinOp(op: string, rs: AST.Visitable) {
        return new (BIN_OPS[op])(rs);
    }

    const BOOL_OPS = {
        or: AST.OrOp,
        and: AST.AndOp
    };

    export function makeBoolNode(input: string, start: number, end: number, elements: any[]) {
        let initialNot = elements[0];
        let ls = elements[1] as AST.Visitable;
        let parts = elements[2].elements;

        let negateFirst = initialNot.text != "";
        var rights = parts.map((v) => {
            let not = v.not.text != "";
            return new (BOOL_OPS[v.op.text])(not, v.rs);
        });

        let left = ls;
        if (negateFirst) {
            left = new AST.NotOp(ls);
        }

        return new AST.BinOpNode(left, rights);
    }

    export function makeRef(input: string, start: number, end: number, elements: ParserNode<any>[]) {
        return new AST.Ref(elements[1].text);
    }

    export function makeBare(input: string, start: number, end: number, elements: AST.Visitable[]) {
        return new AST.BareWord(input.substring(start, end));
    }

    export function makeCompound(input: string, start: number, end: number, elements: any[]) {
        // line numbering: starts from 1
        // the first line is from ls, second and up are from rs
        let [firstBlanks, ls, rs] = elements;
        let lineNum = 1 + firstBlanks.elements.length;

        let lines: Line[] = rs.elements.map((l) => {
            let {blanks, line} = l;
            lineNum += blanks.elements.length;
            return new Line(lineNum, line);
        });
        lines.unshift(new Line(1 + firstBlanks.elements.length, ls));

        var collector = new LineCollector(lines, 0, 0);
        return collector.collect();
    }

    export function makeFuncArg(input: string, start: number, end: number, elements: any[]) {
        return elements[1]; // ignore SPACE
    }

    export function makeFuncCall(input: string, start: number, end: number, elements: any[]) {
        let builder = new FuncCallMaker();

        let first = elements[0] as AST.Visitable;
        let parts = elements[1].elements as AST.Visitable[];
        let colon = elements[2] as any;

        builder.addPart(first);
        parts.map((e) => {
            builder.addPart(e);
        });

        let callParts = builder.build();
        if (colon.elements.length > 0) {
            return new AST.HangingCall(callParts.name + ' :', callParts.args);
        }
        return new AST.FuncCall(callParts.name, callParts.args);
    }
}
