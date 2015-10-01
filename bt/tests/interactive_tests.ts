/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib';

import {CodeRange, InteractiveEvaluator, SourceInfoCompiler} from "../lib/interactive";
import {addAsyncSpyToScope, addSpyToScope} from "./util";


describe('The BackTalker InteractiveEvaluator', () => {
  var evaluator: InteractiveEvaluator, scope: BT.Scope, spyFunc, asyncSpyFunc;
  beforeEach(() => {
      evaluator = new InteractiveEvaluator();
      scope = evaluator.scope;
      spyFunc = addSpyToScope(scope);
      asyncSpyFunc = addAsyncSpyToScope(scope);
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

  it("emits a line-changed event at each line", (done) => {
    var code = `spy on "1"
    spy on "2"
    spy on "3"`;

    var lineSpy = sinon.spy((line: number) => line);
    evaluator.on('line-changed', lineSpy);
    evaluator.eval(BT.parse(code)).then(() => {
      lineSpy.called.should.be.ok;
      lineSpy.firstCall.args[0].lineNumber.should.equal(1);
      lineSpy.firstCall.calledBefore(spyFunc.firstCall).should.be.ok;
      spyFunc.firstCall.calledBefore(lineSpy.secondCall);

      lineSpy.secondCall.args[0].lineNumber.should.equal(2);
      lineSpy.secondCall.calledBefore(spyFunc.secondCall).should.be.ok;
      spyFunc.secondCall.calledBefore(lineSpy.thirdCall);

      lineSpy.thirdCall.args[0].lineNumber.should.equal(3);
      lineSpy.thirdCall.calledBefore(spyFunc.thirdCall).should.be.ok;

      done();
    });
  });

  it("waits for async calls before emitting line-changed events", (done) => {
    var code = `spy on "1"
    spy async on "2"
    spy async on "3"`;

    var lineSpy = sinon.spy((line: number) => line);
    evaluator.on('line-changed', lineSpy);
    evaluator.eval(BT.parse(code)).then(() => {
      lineSpy.called.should.be.ok;
      lineSpy.firstCall.args[0].lineNumber.should.equal(1);
      lineSpy.firstCall.calledBefore(spyFunc.firstCall).should.be.ok;
      spyFunc.firstCall.calledBefore(lineSpy.secondCall);

      lineSpy.secondCall.args[0].lineNumber.should.equal(2);
      lineSpy.secondCall.calledBefore(asyncSpyFunc.firstCall).should.be.ok;
      asyncSpyFunc.firstCall.calledBefore(lineSpy.thirdCall);

      lineSpy.thirdCall.args[0].lineNumber.should.equal(3);
      lineSpy.thirdCall.calledBefore(asyncSpyFunc.secondCall).should.be.ok;

      done();
    });
  });

  it("can have breakpoints set with the BreakPointManager", (done) => {
    let code = `spy on "1"
    spy async on "2"
    spy async on "3"`;

    let ast = BT.parse(code);
    evaluator.breakpoints.add(new BT.AST.Code(2, ast.code.chunk));

    let lineSpy = sinon.spy((line: number) => line);
    let breakpointSpy = sinon.spy((code, vm) => {
      lineSpy.calledOnce.should.be.ok;
      vm.continue();
    });

    evaluator.on('breakpoint-reached', breakpointSpy);
    evaluator.on('line-changed', lineSpy);

    evaluator.eval(ast).then(() => {
      lineSpy.callCount.should.equal(3);
      breakpointSpy.calledOnce.should.be.ok;
      lineSpy.secondCall.calledAfter(breakpointSpy);
      done();
    });
  });

  it("can catch breakpoints in sub-evaluators", (done) => {
    let code = `spy async on "1":
        spy on "2"
        spy on "3"`;

    let ast = BT.parse(code);
    evaluator.breakpoints.add(new BT.AST.Code(2, ast.code.chunk));

    let lineSpy = sinon.spy((line: number) => line);
    let breakpointSpy = sinon.spy((code, vm) => {
      lineSpy.calledOnce.should.be.ok;
      vm.continue();
    });

    evaluator.on('breakpoint-reached', breakpointSpy);
    evaluator.on('line-changed', lineSpy);

    evaluator.eval(ast).then((value) => {
      spyFunc.calledTwice.should.be.ok;
      asyncSpyFunc.calledOnce.should.be.ok;

      lineSpy.callCount.should.equal(3);
      breakpointSpy.calledOnce.should.be.ok;
      lineSpy.secondCall.calledAfter(breakpointSpy);
      done();
    });

  });
});
