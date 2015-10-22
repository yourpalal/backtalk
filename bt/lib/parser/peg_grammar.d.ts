/* tslint:disable:variable-name */
declare module grammar {
    export interface ParserNode<T> {
        text: string;
        offset: number;
        elements: (ParserNode<T>|T)[];
    }

    export interface TreeHandler<T> {
        (input: string, start: number, end: number, things: (ParserNode<T>|T)[]): T;
    }

    export function parse<T>(src: string, actions?: any): T;
}

export = grammar;
