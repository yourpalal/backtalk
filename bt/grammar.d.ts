/// <reference path="back_talker.ts" />

declare module 'grammar' {
  export class ParserNode {
    public isa: string;
    transform(): any // actually Syntax.Visitable
  }

  export var Parser: any;
  export function parse(src: string): ParserNode
}
