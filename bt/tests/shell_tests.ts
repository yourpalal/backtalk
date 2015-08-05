/// <reference path="../typings/tsd.d.ts" />

import BT = require('../lib/back_talker');
import {Shell} from '../lib/shell';

import should = require('should');
import sinon = require('sinon')

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
      scope.addFunc({
        patterns: ["foo:", "bar", "baz"],
        impl: () => 4
      });
      shell.processLine("foo:");
      shell.multiline.should.be.ok;
      shell.processLine(" bar");
      shell.multiline.should.be.ok;
      shell.processLine(" baz");

      shell.multiline.should.be.ok;
      shell.eval.notCalled.should.be.ok;

      shell.processLine("");
      shell.eval.calledOnce.should.be.ok;
      shell.eval.calledWithExactly("foo:\n bar\n baz").should.be.ok;
    });
});
