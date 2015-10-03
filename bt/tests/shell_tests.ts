/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/';
import {Shell} from '../lib/shell';


import {addSpyToScope} from "./util";

describe('The BackTalker Shell', () => {
    var scope, shell;

    beforeEach(() => {
      scope = new BT.Scope();
      BT.StdLib.inScope(scope);

      shell = new Shell(new BT.Evaluator(scope));
      sinon.spy(shell, "eval");
    });

    it('can have one expression per line', () => {
      shell.processLine("3");
      shell.processLine("4");

      shell.multiline.should.not.be.ok;

      shell.eval.alwaysCalledOn(shell).should.be.ok;
      shell.eval.calledTwice.should.be.ok;
      shell.eval.firstCall.calledWithExactly("3").should.be.ok;
      shell.eval.secondCall.calledWithExactly("4").should.be.ok;
    });

    it('can have multiline expressions, which are ended via a blank line', () => {
      let spy = addSpyToScope(scope);
      shell.processLine("spy:");
      shell.multiline.should.be.ok;
      shell.processLine(" spy on 1");
      shell.multiline.should.be.ok;
      shell.processLine(" spy on 2");

      shell.multiline.should.be.ok;
      shell.eval.notCalled.should.be.ok;

      shell.processLine("");
      shell.eval.calledOnce.should.be.ok;
      shell.eval.calledWithExactly("spy:\n spy on 1\n spy on 2").should.be.ok;

      shell.multiline.should.not.be.ok;
    });

    it('can handle async code', (done) => {
      let resolve = null;
      let resolved = false;

      let spy = addSpyToScope(scope, () => {
        resolved.should.be.ok;
        done();
      });

      scope.addFunc(["test async"], (args) => {
        return new Promise((r) => {
          resolve = r;
        });
      });

      shell.processLine("test async");
      shell.waiting.should.be.ok;

      shell.processLine("spy on 1");
      shell.waiting.should.be.ok;

      spy.calledOnce.should.not.be.ok;
      resolve(3);
      resolved = true;
    });
});
