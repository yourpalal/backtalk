// inspired by http://stackoverflow.com/a/31628245/868528

export class BaseError {
    public stack: any;
    public message: string;

    constructor(public msg: string = "[Error]", ...args) {
        this.message = msg;
        this.stack = (new Error())['stack'];
    }
}

BaseError.prototype = Object.create(Error.prototype);
BaseError.prototype.constructor = BaseError;

export class BadTypeError extends BaseError {
    constructor(public value: any, expected: string) {
        super(`Expected type of ${expected}, but got ${typeof value}, ${value} instead`);
    }
}

export class MissingValueError extends BaseError {
    constructor(public value: any) {
        super(`Expected value, but found ${value}`);
    }
}

export class MissingPropertyError extends BaseError {
    constructor(obj: any, public name: string) {
        super(`property ${name} does not exist on ${obj}`);
    }
}
