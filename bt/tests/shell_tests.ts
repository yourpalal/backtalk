/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/back_talker';
import {Shell} from '../lib/shell';


import {addSpyToScope} from "./util";

describe('The BackTalker Shell', () => {
    var scope, shell;

    beforeEach(() => {
      scope = new BT.Scope();
      BT.StdLib.inScope(scope);

      shell = new Shell(new BT.Evaluator(scope));
      sinon.spy(shell, "eval");
      addSpyToScope(scope);
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
});
