import {StackExpresser} from "./expressers";

var parts = [
  { // assignment
    patterns: ['with $!!:ref as $:val', 'with $!!:ref as:'],
    impl: function(args, ret) {
      if (this.newSubEval) {
        return this.eval(this.body).now((val) => {
          this.scope.parent.set(args.named.ref.name, val);
          ret.set(val);
        });
      }

      let val = args.named.val;
      this.scope.set(args.named.ref.name, val);
      return ret.set(val);
    }
  },
  { // list constructor
    patterns: ['list of:'],
    impl: function(args, ret) {
      // StackExpresser calls 'push' on each result
      var parts = [];
      this.evalExpressions(this.body, new StackExpresser(parts));

      return ret.set(parts);
    }
  },
  { // list accessor
    patterns: ['item $:count of $:list'],
    impl: function(args, ret) {
      var count = args.getNumber("count");
      return ret.set(args.named.list[count - 1]);
    }
  },
  { // printer
    patterns: ['print $:arg'],
    impl: function(args, ret) {
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
