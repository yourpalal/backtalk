// inspired by http://stackoverflow.com/a/31628245/868528

export class BaseError {
  constructor(public msg:string = "[Error]", ...args) {
    Error.apply(this, args);
  }
}

BaseError.prototype = <any>new Error();

export class BadTypeError extends BaseError {
  constructor(public value:any, expected: string) {
    super(`Expected type of ${expected}, but got ${typeof value}, ${value} instead`);
  }
}
