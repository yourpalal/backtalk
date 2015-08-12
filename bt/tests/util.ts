/// <reference path="../typings/tsd.d.ts" />
import * as sinon from 'sinon';

import {Evaluator} from "../lib/evaluator";
import {Scope} from "../lib/scope";

function ident(a) {
  return a;
};

export function addSpyToScope(scope: Scope, hook: Function = ident) {
  var spyFunc = sinon.spy(function(a) {
      var self = <Evaluator>this;
      var result = hook.call(this, a);
      if (self.newSubEval) {
          return self.eval(self.body);
      }
      return result;
  });

  scope.addFunc({
    patterns: ["spy <|on $:a|on $:a $:b|on $:a $:b $:c|on $:a $:b $:c $:d>"],
    impl: spyFunc
  });

  return spyFunc;
}
