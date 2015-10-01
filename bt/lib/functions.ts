import {BadTypeError, BaseError} from './errors';
import {EventEmitter} from './events';
import {Visitable as ASTVisitable} from './parser/ast';

export class FuncParams {
  named: any;
  body: ASTVisitable = null;

  constructor(public passed: any[], params: FuncParam[]) {
    this.named = {};
    if (params === null) {
      return
    }

    var i = 0;
    params.forEach((param) => {
      if (param.fromVar) {
        this.named[param.name] = passed[i];
        i++;
      } else {
        this.named[param.name] = param.value;
      }
    });
  }

  has(name: string): boolean {
    if (this.named.hasOwnProperty(name)) {
      return true;
    }
    return false;
  }

  get(name :string, missing?: any): any {
    if (this.has(name)) {
      return this.named[name];
    }
    return missing;
  }

  choose<T>(name :string, values:T[], missing?: T) :T {
    if (this.has(name)) {
      return values[this.named[name]];
    }
    return missing;
  }

  hasNumber(name: string): boolean {
    return this.has(name) && (typeof this.named[name] == 'number');
  }

  getNumber(name: string): number {
    if (!this.hasNumber(name)) {
      throw new BadTypeError(this.named[name], 'number');
    }
    return this.named[name];
  }

  hasString(name: string): boolean {
    return this.has(name) && (typeof this.named[name] == 'string');
  }

  getString(name: string): string {
    if (!this.hasString(name)) {
      throw new BadTypeError(this.named[name], 'string');
    }
    return this.named[name];
  }
}

export class FuncParam {
    constructor(public name: string, public value: any, public fromVar: boolean) {
    }

    withValue(value: any): FuncParam {
      return new FuncParam(this.name, value, this.fromVar);
    }

    static forVar(name: string) {
      return new FuncParam(name, null, true);
    }

    static forChoice(name: string) {
      return new FuncParam(name, 0, false);
    }
}

export class TooEagerError extends BaseError {
  constructor() {
    super("Attempted to get FuncResult value before it was fulfilled");
  }
}


/**
 * @class FutureResult
 * @description FuncResult wrapper that separates async behaviour from sync.
 */
export class FutureResult {
  constructor(private result: FuncResult) {
      // we really wanted package-private, anyway
      (<any>result as FuncResultPrivateFields).beganAsync = true;
  }

  resolve(r: FuncResult) {
    r.now((value) => this.set(value));
    return this;
  }

  set(v?: any) {
    this.result.setAsyncViaFuture(v, this);
  }
}

interface FuncResultPrivateFields {
    value: any;
    haveValue: boolean;
    beganAsync: boolean;
    emitter: EventEmitter;
}


/**
 * @class FuncResult
 * @description FuncResult is much like a promise, with the exception that it
 *  can sometimes be used synchronously.
 */
export class FuncResult {
  private value: any;
  private haveValue: boolean = false;
  private beganAsync: boolean = false;

  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter(['set']);
  }

  sync(v?: any) {
    this.value = v;
    this.haveValue = true;

    this.emitter.emitAsync('set', this, this.value);
    return this;
  }

  setAsyncViaFuture(v: any, future: FutureResult) {
    this.value = v;
    this.haveValue = true;

    this.emitter.emitAsync('set', this, this.value);
    return this;
  }

  isAsync(): boolean {
    return this.beganAsync;
  }

  isVoid(): boolean {
    return !this.haveValue && !this.beganAsync;
  }

  isFulfilled(): boolean {
    return this.haveValue;
  }

  get() {
    if (!this.isFulfilled()) {
      throw new TooEagerError();
    }
    return this.value;
  }

  beginAsync(): FutureResult {
    return new FutureResult(this);
  }

  /**
   * Like then, but it might execute the callback synchronously.
   * @param  {any} onFulfilled callback, called with the value
   * @returns {FuncResult} this
   */
  now(onFulfilled: {(any): any}): FuncResult {
    if (this.isFulfilled()) {
      onFulfilled.call(this, this.value);
    } else {
      this.emitter.on('set', onFulfilled);
    }
    return this;
  }

  /**
   * Add a callback to be run when the FuncResult is fulfilled. The
   * callback will always run async, but may run very soon if the result is
   * already set.
   *
   * @param  {{(any} onFulfilled [description]
   * @return {any}               [description]
   */
  then(onFulfilled: {(any): any}): FuncResult {
    if (this.isFulfilled()) {
      setTimeout(() => onFulfilled.call(this, this.value), 0);
    } else {
      this.emitter.on('set', onFulfilled);
    }
    return this;
  }
}
