import {Evaluator} from "./evaluator";
import {FuncParams, FuncResult} from "./functions";
import {StackExpresser} from "./expressers";

var parts = [
  { // assignment
    patterns: ['with $!!:ref as $:val', 'with $!!:ref as:'],
    impl: function(args: FuncParams, ret: FuncResult, self: Evaluator) {
      if (args.body) {
        return self.makeSub().eval(args.body).now((val) => {
          self.scope.set(args.named.ref.name, val);
          ret.set(val);
        });
      }

      let val = args.named.val;
      self.scope.set(args.named.ref.name, val);
      return ret.set(val);
    }
  },
  { // list constructor
    patterns: ['list of:'],
    impl: function(args: FuncParams, ret: FuncResult, self: Evaluator) {
      // StackExpresser calls 'push' on each result
      var parts = [];
      self.evalExpressions(args.body, new StackExpresser(parts));

      return ret.set(parts);
    }
  },
  { // list accessor
    patterns: ['item $:count of $:list'],
    impl: function(args: FuncParams, ret: FuncResult, self: Evaluator) {
      var count = args.getNumber("count");
      return ret.set(args.named.list[count - 1]);
    }
  },
  { // printer
    patterns: ['print $:arg'],
    impl: function(args: FuncParams, ret: FuncResult, self: Evaluator) {
      console.log(args.named.arg);

      return ret.set(args.named.arg);
    }
  }

 ];

export function inScope(scope) {
  parts.forEach(function(f) {
    scope.addFunc(f.patterns, f.impl);
  });
  return scope;
}
