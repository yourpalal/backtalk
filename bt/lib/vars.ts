import {Scope} from "./scope";

/** @module vars */

/** @enum vars.Vivify
 * @description The kinds of vivification which are acceptable for a variable.
 */
export enum Vivify {
    ALWAYS = 1,
    NEVER = 0,
    AUTO = 2
};

/** @class vars.AutoVar
 * Represents a variable in a scope, which may or may not be defined.
 */
export class AutoVar {
    defined: boolean;

    constructor(public name: string, scope: Scope, public value: any) {
        this.defined = (typeof value !== 'undefined');
    }
}
