import {FuncDefCollection} from "./funcdefs";
import {FuncParams} from "./functions";
import {AutoVar, Vivify} from "./vars";
import {Trie} from "./trie";

/** @module scope */

export interface FuncHandle {
  name: string,
  vivification: Vivify[]
  parameterize: (...args: any[]) => FuncParams
  impl: (p: FuncParams) => any
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

  addFunc = function(deets: { patterns: string[]; impl: (...b: any[]) => any }) {
    deets.patterns.map((pattern) => {
      var result = FuncDefCollection.fromString(pattern);

      // now we can register a wrapper for all of the specified functions
      // that will append the dynamic parts of the pattern as arguments
      result.defs.forEach((pattern) => {
        var name = pattern.bits.join(" ");
        this.funcs.put(name, {
          name: name,
          vivification: pattern.vivify,
          parameterize: pattern.makeParameterizer(),
          impl: deets.impl,
        });
      });
    });
  };
}
