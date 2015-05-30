import vars = require("./vars")
import funcs = require("./functions")


interface FuncHandle {
  vivification: vars.Vivify[]
  impl: (...args: any[]) => any
}

export class Scope {
  names: { [key: string]: any }
  funcs: { [key: string]: FuncHandle }

  constructor(public parent: Scope = null) {
    if (this.parent !== null) {
      this.names = Object.create(parent.names);
      this.funcs = Object.create(parent.funcs);
    } else {
      this.names = <{ [key: string]: any }>new Object();
      this.funcs = <{ [key: string]: any }>new Object();
    }
  }

  createSubScope(): Scope {
    return new Scope(this);
  }

  set(name: string, val: any) {
    this.names[name] = val;
  }

  get(name: string): any {
    return this.names[name];
  }

  getVivifiable(name: string): vars.AutoVar {
    return new vars.AutoVar(name, this, this.names[name]);
  }

  findFunc(name: string) {
    return this.funcs['0' + name];
  }

  addFunc = function(deets: { patterns: string[]; impl: (...b: any[]) => any }) {
    // $ = variable
    // <bare|words> = bare options
    // $!! = just get the name of the var
    // $! = auto-vivifiable variable this is good for placeholders, for instance
    //          you will get an instance of BackTalker.AutoVar if an argument is
    //          auto-vivified.
    //
    // deets = {
    //  patterns: ["bare with $! arguments $", "dynamic with <bare|words> arguments $"]
    //  impl: function(a, b, c) {
    //  }
    //}
    deets.patterns.map((pattern) => {
      var result = funcs.FuncDefCollection.fromString(pattern);

      // now we can register a wrapper for all of the specified functions
      // that will append the dynamic parts of the pattern as arguments
      result.defs.forEach((pattern) => {
        this.funcs['0' + pattern.bits.join(" ")] = {
          vivification: pattern.vivify,
          impl: function(...args: any[]): any {
            args = args.concat(pattern.dyn);
            return deets.impl.apply(this, args);
          }
        };
      });
    });
  };
}
