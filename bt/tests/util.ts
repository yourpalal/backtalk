/// <reference path="../typings/tsd.d.ts" />
import * as sinon from 'sinon';
import * as should from 'should';

import {FuncParams, FuncResult, FutureResult} from "../lib/functions";
import {Evaluator} from "../lib/evaluator";
import {Scope} from "../lib/scope";

function ident(a: FuncParams, ret: FuncResult) {
  ret.sync(a);
};

function identAsync(a: FuncParams, future: FutureResult) {
  future.set(a);
};

export function addSpyToScope(scope: Scope, hook: Function = ident) {
  var spyFunc = sinon.spy((a: FuncParams, ret: FuncResult, self: Evaluator) => {
      if (a.body) {
        ret.beginAsync().resolve(self.makeSub().eval(a.body));
      } else {
        hook.call(self, a, ret, self);
      }
  });

  let pattern = ["spy <|on $:a|on $:a $:b|on $:a $:b $:c|on $:a $:b $:c $:d> <|:>"];
  scope.addFunc(pattern, spyFunc);

  return spyFunc;
}

export function addAsyncSpyToScope(scope: Scope, hook: Function = identAsync) {
  var spyFunc = sinon.spy((a: FuncParams, ret: FuncResult, self: Evaluator) => {
      let future = ret.beginAsync();
      if (a.body) {
        setTimeout(() => future.resolve(self.makeSub().eval(a.body)), 0);
      } else {
        setTimeout(() => hook.call(self, a, future, self), 0);
      }
  });

  let pattern = ["spy async <|on $:a|on $:a $:b|on $:a $:b $:c|on $:a $:b $:c $:d> <|:>"];
  scope.addFunc(pattern, spyFunc);

  return spyFunc;
}
