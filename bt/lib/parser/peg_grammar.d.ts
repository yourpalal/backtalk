declare module grammar {

  export function Parser(): void
  export function parse(src: string): ParserNode

  export interface ParserNode {
    isa: string;
    transform: () => any
  }

  module Parser {
    export var NumberLiteral: ParserNode;
    export var StringLiteral: ParserNode;

    export var ParenNode: ParserNode;
    export var RefNode: ParserNode;

    export var CompoundNode: ParserNode;
    export var FuncCallNode: ParserNode;

    export var LineNode: ParserNode;
    export var BareNode: ParserNode;

    export var Expression: ParserNode;
    export var ProdQuoNode: ParserNode;
    export var Comment: ParserNode;
    export var SPACE: ParserNode;
    export var ArithValueNode: ParserNode;
  }
}

export = grammar
