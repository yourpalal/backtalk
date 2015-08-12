/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/back_talker';

import {InteractiveEvaluator} from "../lib/interactive";
import {addSpyToScope} from "./util";


describe('The BackTalker InteractiveEvaluator', function() {
  var evaluator: InteractiveEvaluator, scope: BT.Scope, spyFunc;
  beforeEach(function() {
      evaluator = new InteractiveEvaluator();
      scope = evaluator.scope;
      spyFunc = addSpyToScope(scope);
  });

  it("emits a line-changed event at each line", function() {
    var code = `spy on "1"
    spy on "2"
    spy on "3"`;

    var spy = sinon.spy((line: number) => line);
    evaluator.on('line-changed', spy);
    evaluator.eval(BT.parse(code));

    spy.firstCall.calledWith(1).should.be.ok;
    spy.firstCall.calledBefore(spyFunc.firstCall).should.be.ok;
    spyFunc.firstCall.calledBefore(spy.secondCall);

    spy.secondCall.calledWith(2).should.be.ok;
    spy.secondCall.calledBefore(spyFunc.secondCall).should.be.ok;
    spyFunc.secondCall.calledBefore(spy.thirdCall);

    spy.thirdCall.calledWith(3).should.be.ok;
    spy.thirdCall.calledBefore(spyFunc.thirdCall).should.be.ok;
  });
});
