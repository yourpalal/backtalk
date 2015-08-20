/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/back_talker';

import {CodeRange, InteractiveEvaluator, SourceInfoCompiler} from "../lib/interactive";
import {addSpyToScope} from "./util";


describe('The BackTalker InteractiveEvaluator', () => {
  var evaluator: InteractiveEvaluator, scope: BT.Scope, spyFunc;
  beforeEach(function() {
      evaluator = new InteractiveEvaluator();
      scope = evaluator.scope;
      spyFunc = addSpyToScope(scope);
  });

  it("has a compiler that adds line numbers", () => {
    let code = `spy on "1"
    spy on "2"
    spy on "3"`;

    let compiler = new SourceInfoCompiler();
    BT.parse(code).accept(compiler);

    compiler.ranges.map((range) => range.count)
      .reduce((a, b) => a + b)
      .should.equal(compiler.instructions.length);
  });

  it("emits a line-changed event at each line", () => {
    var code = `spy on "1"
    spy on "2"
    spy on "3"`;

    var lineSpy = sinon.spy((line: number) => line);
    evaluator.on('line-changed', lineSpy);
    evaluator.eval(BT.parse(code));

    lineSpy.called.should.be.ok;
    lineSpy.firstCall.calledWith(1).should.be.ok;
    lineSpy.firstCall.calledBefore(spyFunc.firstCall).should.be.ok;
    spyFunc.firstCall.calledBefore(lineSpy.secondCall);

    lineSpy.secondCall.calledWith(2).should.be.ok;
    lineSpy.secondCall.calledBefore(spyFunc.secondCall).should.be.ok;
    spyFunc.secondCall.calledBefore(lineSpy.thirdCall);

    lineSpy.thirdCall.calledWith(3).should.be.ok;
    lineSpy.thirdCall.calledBefore(spyFunc.thirdCall).should.be.ok;
  });
});
