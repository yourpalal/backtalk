/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/back_talker';
import * as VM from '../lib/vm';



import {addSpyToScope} from "./util";

class ExpresserSpy implements VM.Expresser {
  public express: { (any): void};
  public finish: { ():void };

  constructor() {
    this.express = sinon.spy();
    this.finish = sinon.spy();
  }
};

describe('The BackTalker VM', () => {
    var evaluator: BT.Evaluator, scope: BT.Scope, spyFunc, expressed, vm: VM.VM, frame: VM.VMFrame;

    beforeEach(() => {
      scope = new BT.Scope();
      evaluator = new BT.Evaluator(scope);
      spyFunc = addSpyToScope(scope);
      var expresserSpy = new ExpresserSpy();
      expressed = <any>expresserSpy.express;

      vm = new VM.VM(expresserSpy);
      frame = vm.makeFrame();
    });

    it('can do simple math', () => {
      vm.execute([
        new VM.Instructions.Push(3),
        new VM.Instructions.Push(2),
        VM.Instructions.Add,
        VM.Instructions.Express
      ], frame, evaluator);

      expressed.calledOnce.should.be.ok;
      expressed.calledWith(5).should.be.ok;
    });

    it('can call a function', () => {
      vm.execute([
        new VM.Instructions.Push(3),
        new VM.Instructions.Push(2),
        new VM.Instructions.CallFunc("spy on $ $"),
        VM.Instructions.Express
      ], frame, evaluator);

      expressed.calledOnce.should.be.ok;
      spyFunc.calledOnce.should.be.ok;
      var params = spyFunc.firstCall.args[0];
      params.named.should.have.property("a", 3);
      params.named.should.have.property("b", 2);
    });
});

describe('The BackTalker Compiler', () => {
  describe('turns ASTs into instructions', () => {
      it('can compile math', () => {
          var result = VM.Compiler.compile(BT.parse("3 + 4"));
          result.should.eql([
            new VM.Instructions.Push(3),
            new VM.Instructions.Push(4),
            VM.Instructions.Add,
            VM.Instructions.Express
          ]);

          result = VM.Compiler.compile(BT.parse("3 / 4"));
          result.should.eql([
            new VM.Instructions.Push(3),
            new VM.Instructions.Push(4),
            VM.Instructions.Div,
            VM.Instructions.Express
          ]);
      });

      it('can compile func calls', () => {
          var result = VM.Compiler.compile(BT.parse("spy on $foo $bar 3"));
          result.should.eql([
            new VM.Instructions.GetVivifiable("foo"),
            new VM.Instructions.GetVivifiable("bar"),
            new VM.Instructions.Push(3),
            new VM.Instructions.CallFunc("spy on $ $ $"),
            VM.Instructions.Express
          ]);

          result = VM.Compiler.compile(BT.parse("spy on"));
          result.should.eql([
            new VM.Instructions.CallFunc("spy on"),
            VM.Instructions.Express
          ]);
      });
  });
});
