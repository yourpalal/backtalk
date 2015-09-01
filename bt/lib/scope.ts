import {FuncDef, FuncDefCollection, FuncParameterizer} from "./funcdefs";
import {FuncParams, FuncResult} from "./functions";
import {Trie} from "./trie";
import {AutoVar, Vivify} from "./vars";

/** @module scope */

interface Func {
  (p: FuncParams, r: FuncResult): any;
}

export class FuncHandle {
  public vivification: Vivify[];
  public parameterize: FuncParameterizer;

  constructor(public name: string, public impl: Func, funcdef: FuncDef) {
    this.vivification = funcdef.vivify;
    this.parameterize = funcdef.makeParameterizer();
  }
}

/** @class scope.Scope
 * @description Scope keeps track of variable and function names. It uses
 *  prototype inheritance to make sure all variables from a parent scope are
 *  visible within child scopes. Function names are handled specially.
 */
export class Scope {
  names: { [key: string]: any }
  funcs: Trie<FuncHandle>;

  constructor(public parent: Scope = null) {
    if (this.parent !== null) {
      this.names = Object.create(parent.names);
    } else {
      this.names = <{ [key: string]: any }>new Object();
    }
    this.funcs = new Trie<FuncHandle>();
  }

  /**
   * @method scope.Scope#createSubScope
   * @returns A new scope that has all functions and variables of this one, but
   *  can add its own functions and variables as well.
   */
  createSubScope(): Scope {
    return new Scope(this);
  }

  set(name: string, val: any) {
    this.names[name] = val;
  }

  has(name: string): any {
    return name in this.names;
  }

  get(name: string): any {
    return this.names[name];
  }

  /** @method scope.Scope#getVivifiable
   * @returns {Autovar} handle for a given name in this scope.
   */
  getVivifiable(name: string): AutoVar {
    return new AutoVar(name, this, this.names[name]);
  }

  findFunc(name: string): FuncHandle {
    var f = this.funcs.get(name);
    if (f) {
      return f;
    }
    if (this.parent) {
      return this.parent.findFunc(name);
    }
    return null;
  }

  addFunc(patterns: string[], impl: Func) {
    patterns.map((pattern) => {
      var result = FuncDefCollection.fromString(pattern);

      // now we can register a wrapper for all of the specified functions
      // that will append the dynamic parts of the pattern as arguments
      result.defs.forEach((funcdef) => {
        var name = funcdef.tokens.join(" ");
        this.funcs.put(name, new FuncHandle(name, impl, funcdef));
      });
    });
  };
}
