'use strict';

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
      // eval each line in the block scope, and put all results into
      // a list
      return this.body.parts.map((p) => this.eval(p));
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
