import * as AST from "./ast";
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
export class Line {
    constructor(public indent: number, public expression: AST.Visitable) {
    }

    isEmpty(): boolean {
        return this.expression == null;
    }

    accept(v: AST.Visitor) {
        if (this.expression) {
            return this.expression.accept(v);
        }
        return null;
    }

    static makeError(): Line {
        return new Line(0, new AST.SyntaxError());
    }
}

export type ParseResult = ParserNode<AST.Visitable>|AST.Visitable;

export module grammarActions {
    export function makeLine(input: string, start: number, end: number, elements: ParseResult[]) {
        let [indent, expression] = elements;

        // empty lines do not have an expression, so it stays as a canopy thing
        if ('elements' in expression) {
            return new Line(0, null);
        }
        return new Line((indent as ParserNode<any>).text.length, expression as AST.Visitable);
    }

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
        '|': AST.OrOp,
        '&': AST.AndOp
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
