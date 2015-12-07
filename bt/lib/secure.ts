import {BaseError, MissingPropertyError, MissingValueError} from "./errors";

export class IllegalPropertyError extends BaseError {
    constructor(private name: string) {
        super(`attempted to access illegal property ${name}`);
    }
}

const ILLEGAL_PROPERTIES = {
    "constructor": true,
    "eval": true,
    "prototype": true,
    "Function": true,
};

export function getProperty(obj: any, name: string): any {
    // TODO: if we allow symbols, we should probably disallow
    // Symbol.species

    if (obj === null || obj === undefined) {
        throw new MissingValueError(obj);
    }

    if (name in ILLEGAL_PROPERTIES) {
        throw new IllegalPropertyError(name);
    }

    if (name in obj) {
        return obj[name];
    }

    throw new MissingPropertyError(obj, name);
}
