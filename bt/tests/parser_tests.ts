/// <reference path="../typings/tsd.d.ts" />

import should = require('should');
import sinon = require('sinon');

import BT = require('../lib/back_talker');
import syntax = require('../lib/syntax');


describe("The BackTalker parser", () => {
  describe("provides line numers", () => {
    it("starting from 1", () => {
      var parsed = BT.parse("line 1\nline 2");

      parsed.should.be.an.instanceOf(syntax.CompoundExpression);
      (<syntax.CompoundExpression>parsed).parts[0].code.should.have.property("lineNumber", 1);
      (<syntax.CompoundExpression>parsed).parts[1].code.should.have.property("lineNumber", 2);
    });

    it("including blank lines", () => {
      var parsed = BT.parse("\n\n\nline 4\n\nline 6");

      parsed.should.be.an.instanceOf(syntax.CompoundExpression);
      (<syntax.CompoundExpression>parsed).parts[0].code.should.have.property("lineNumber", 4);
      (<syntax.CompoundExpression>parsed).parts[1].code.should.have.property("lineNumber", 6);
    });
  });

  describe("groups lines into hanging call bodies by leading whitespace", () => {
    var parsed = <syntax.CompoundExpression>BT.parse(`
    with $a as:
     "in the block"
      "also in the block"
    $a`);

    parsed.parts.should.have.length(2); // hanging call + $a

    parsed.parts[0].should.be.an.instanceOf(syntax.HangingCall);
    (<syntax.HangingCall>parsed.parts[0]).body.parts.should.have.length(2);
  });
});
