import {BadTypeError} from "./errors";

// everything in this file should be pure functional
// because I want it that way

export class FuncParams {
  named: { [key: string]: any }

  constructor(public passed: any[], params: FuncParam[]) {
    this.named = {};
    if (params === null) {
      return
    }

    // impure, but convenient
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
}

export module FuncParam{
  export function forVar(name: string) {
    return new FuncParam(name, null, true);
  }

  export function forChoice(name: string) {
    return new FuncParam(name, 0, false);
  }
}
