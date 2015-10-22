import {BaseError} from "../errors";
import * as AST from "./ast";

import {grammarActions} from "./grammar";
import * as grammar from "./peg_grammar";

var parser: Parser = null;

/** @function syntax.parse
 * @param {string} source - the backtalk source code to parse.
 * @param [inspector] - optional function which is called with the raw Canopy AST
 * before it's turned into a backtalk AST.
 */
export function parse(source: string, chunkName?: string): AST.Visitable {
    parser = parser || new Parser();
    return parser.parse(source, chunkName);
}

export class ParseError extends BaseError {
    public inner: any;

    constructor(err) {
        super(`ParseError: ${err.message}`);
        this.inner = err;
    }

    toString() {
        return this.inner;
    }
}

export class MissingBodyError extends BaseError {
    constructor(public location: AST.Code) {
        super(`Missing body for hanging functoin call at ${location.chunk}:${location.lineNumber}`);
    }
}

export class Parser {
    parse(source: string, chunkName: string = "unnamed"): AST.Visitable {
        try {
            var ast = grammar.parse<AST.Visitable>(source, {actions: grammarActions});
        } catch (e) {
            if (e instanceof MissingBodyError) {
                throw e;
            }
            throw new ParseError(e);
        }

        ast.accept(new ChunkNamer(chunkName));
        return ast;
    }
}

class ChunkNamer extends AST.BaseVisitor {
    constructor(private name: string) {
        super();
    }

    visitVisitable(v: AST.Visitable, ...args: any[]): any {
        if (v.code !== null) {
            v.code.chunk = this.name;
        }
        v.acceptForChildren(this);
    }
}
