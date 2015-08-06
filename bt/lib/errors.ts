// inspired by http://stackoverflow.com/a/31628245/868528

export class BaseError {
  constructor(public msg:string = "[Error]", ...args) {
    Error.apply(this, args);
  }
}

BaseError.prototype = <any>new Error();
