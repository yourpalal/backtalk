// TODO: this isn't quite right...

declare module grammar {
  export class ParserNode {
    public isa: string;
    transform(): any // actually BackTalker.Syntax.Visitable
  }

  export var Parser: any;
  export function parse(src: string): ParserNode
}
