import {BaseError} from "../errors";
import * as AST from "./ast";

import {grammarActions, Line} from "./grammar";
import * as grammar from "./peg_grammar";

var parser: Parser = null;

/** @function syntax.parse
 * @param {string} source - the backtalk source code to parse.
 * @param [inspector] - optional function which is called with the raw Canopy AST
 * before it's turned into a backtalk AST.
 */
export function parse(source: string, chunkName?: string): ParseResult {
    parser = parser || new Parser();
    return parser.parse(source, chunkName);
}

export function parseOrThrow(source: string, chunkName?: string): AST.CompoundExpression {
    return parse(source, chunkName).throwErrors().ast;
}

export class LineParseError {
    constructor(public inner: Error, public line: number) {
    }
}

export class ParseError extends BaseError {
    constructor(public errors: LineParseError[]) {
        super(`ParseError: on lines ${errors.map(e => e.line).join(", ")}`);
    }

    toString() {
        let messages = this.errors.map(e => `${e.line}: ${e.inner.toString()}`);
        return `parse errors:\n ${messages.join("\n")}`;
    }
}

export class MissingBodyError extends BaseError {
    constructor(public location: AST.Code) {
        super(`Missing body for hanging functoin call at ${location.chunk}:${location.lineNumber}`);
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

            parts.push(this.lines[this.i].expression.accept(this));
        }

        return new AST.CompoundExpression(parts);
    }

    visitVisitable(a: AST.Visitable): any { return a; }

    static transform(lines: Line[]): AST.CompoundExpression {
        return new LineCollector(lines, 0, 0).collect();
    }
}


export class ParseResult {
    constructor(public ast: AST.CompoundExpression, public errors: LineParseError[]) {
    }

    throwErrors(): ParseResult {
        if (this.errors && this.errors.length  > 0) {
            throw new ParseError(this.errors);
        }
        return this;
    }
}


export class Parser {
    parse(source: string, chunkName: string = "unnamed"): ParseResult {
        let codeSetter = new CodeSetter(new AST.Code(1, chunkName));
        let errors: LineParseError[] = [];

        let lines = this.split(source)
            .map((l, i) => {
                try {
                    var line = this.parseLine(l);
                } catch(e) {
                    if (!(e instanceof SyntaxError)) {
                        throw e;
                    }
                    errors.push(new LineParseError(e, i + 1));
                    return Line.makeError();
                }
                line.accept(codeSetter);
                codeSetter.incrementLine();
                return line;
            })
            .filter((l) => !l.isEmpty());

        return new ParseResult(LineCollector.transform(lines), errors);
    }

    private split(source: string): string[] {
        return source.split("\n");
    }

    private parseLine(source: string): Line {
        return grammar.parse<Line|AST.Visitable>(source, {actions: grammarActions}) as Line;
    }
}


class CodeSetter extends AST.BaseVisitor {
    constructor(private code: AST.Code) {
        super();
    }

    incrementLine() {
        this.code = this.code.atLine(this.code.lineNumber + 1);
    }

    visitVisitable(v: AST.Visitable, ...args: any[]): any {
        v.code = this.code;
        v.acceptForChildren(this);
    }

    visitHangingCall(v: AST.HangingCall, ...args: any[]): any {
        v.code = this.code;
        // ignore v.body, which may not be set yet, and will be on separate lines anyway!
        v.acceptForArgs(this);
    }
}
