/// <reference path="back_talker.ts" />
'use strict';

module BackTalker {
  export class StdLib {
    static parts = [
      {
        'patterns': ['with $!! as $'],
        'impl': function(ref, val) {
          this.scope.set(ref.name, val);
          return val;
        }
      }]

    static inScope(scope) {
      StdLib.parts.forEach(function(f) {
        scope.addFunc(f);
      });
      return scope;
    }
  }
}
