'use strict';

var parts = [
  {
    patterns: ['with $!!:ref as $:val'],
    impl: function(args) {
      this.scope.set(args.named.ref.name, args.named.val);
      return args.named.val;
    }
  }];

export function inScope(scope) {
  parts.forEach(function(f) {
    scope.addFunc(f);
  });
  return scope;
}
