/// <reference path="../typings/tsd.d.ts" />
import * as sinon from 'sinon';
import * as should from 'should';

import {Evaluator} from "../lib/evaluator";
import {Scope} from "../lib/scope";

function ident(a, ret) {
  ret.set(a);
};

export function addSpyToScope(scope: Scope, hook: Function = ident) {
  var spyFunc = sinon.spy(function(a, ret) {
      var self = <Evaluator>this;
      if (self.newSubEval) {
        ret.resolve(self.eval(self.body));
      } else {
        hook.call(this, a, ret);
      }
  });

  let pattern = ["spy <|on $:a|on $:a $:b|on $:a $:b $:c|on $:a $:b $:c $:d>"];
  scope.addFunc(pattern, spyFunc);

  return spyFunc;
}

export function addAsyncSpyToScope(scope: Scope, hook: Function = ident) {
  var spyFunc = sinon.spy(function(a, ret) {
      var self = <Evaluator>this;
      if (self.newSubEval) {
        setTimeout(() => ret.resolve(self.eval(self.body)), 0);
      } else {
        setTimeout(() => hook.call(this, a, ret), 0);
      }
  });

  let pattern = ["spy async <|on $:a|on $:a $:b|on $:a $:b $:c|on $:a $:b $:c $:d>"];
  scope.addFunc(pattern, spyFunc);

  return spyFunc;
}
