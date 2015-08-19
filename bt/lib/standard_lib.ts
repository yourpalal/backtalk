import {StackExpresser} from "./expressers";

var parts = [
  { // assignment
    patterns: ['with $!!:ref as $:val', 'with $!!:ref as:'],
    impl: function(args) {
      var bodyValue = this.newSubEval ? this.eval(this.body) : null,
          val = args.get("val", bodyValue),
          scope = this.newSubEval ? this.scope.parent : this.scope;
      scope.set(args.named.ref.name, val);
      return val;
    }
  },
  { // list constructor
    patterns: ['list of:'],
    impl: function(args) {
      // StackExpresser calls 'push' on each result
      var parts = [];
      this.evalExpressions(this.body, new StackExpresser(parts));
      return parts;
    }
  },
  { // list accessor
    patterns: ['item $:count of $:list'],
    impl: function(args) {
      var count = args.getNumber("count");
      return args.named.list[count - 1];
    }
  },
  { // printer
    patterns: ['print $:arg'],
    impl: function(args) {
      console.log(args.named.arg);
    }
  }

 ];

export function inScope(scope) {
  parts.forEach(function(f) {
    scope.addFunc(f);
  });
  return scope;
}
