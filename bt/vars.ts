import scope = require("./scope")

export enum Vivify {
  ALWAYS = 1,
  NEVER = 0,
  AUTO = 2
};

export class AutoVar {
  defined: boolean;

  constructor(public name: string, scope: scope.Scope, value: any) {
    this.defined = (typeof value !== 'undefined');
  }
}
