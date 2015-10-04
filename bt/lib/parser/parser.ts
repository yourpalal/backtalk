import {BaseError} from "../errors";
import * as AST from "./ast";

import * as grammar from "./grammar";

var _parser: Parser = null;

/** @function syntax.parse
 * @param {string} source - the backtalk source code to parse.
 * @param [inspector] - optional function which is called with the raw Canopy AST
 * before it's turned into a backtalk AST.
 */
export function parse(source: string, chunkName?: string): AST.Visitable {
    _parser = _parser || new Parser();
    return _parser.parse(source, chunkName);
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

export class MissingBodyError extends BaseError {
    constructor(public location: AST.Code) {
        super(`Missing body for hanging functoin call at ${location.chunk}:${location.lineNumber}`);
    }
}

export class Parser {
    inspect(p: grammar.ParserNode): void {
    }

    parse(source: string, chunkName: string = "unnamed"): AST.Visitable {
        try {
            var parse_tree = grammar.parse(source);
        } catch (e) {
            throw new ParseError(e);
        }

        this.inspect(parse_tree);
        let ast = <AST.Visitable>parse_tree.transform();
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
