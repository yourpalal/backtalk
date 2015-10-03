/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib';
import * as AST from '../lib/parser/ast';
import {MissingBodyError} from '../lib/parser/parser';


describe("The BackTalker parser", () => {
  describe("provides line numers", () => {
    it("starting from 1", () => {
      var parsed = BT.parse("line 1\nline 2");

      parsed.should.be.an.instanceOf(AST.CompoundExpression);
      (<AST.CompoundExpression>parsed).parts[0].code.should.have.property("lineNumber", 1);
      (<AST.CompoundExpression>parsed).parts[1].code.should.have.property("lineNumber", 2);
    });

    it("including blank lines", () => {
      var parsed = BT.parse("\n\n\nline 4\n\nline 6");

      parsed.should.be.an.instanceOf(AST.CompoundExpression);
      (<AST.CompoundExpression>parsed).parts[0].code.should.have.property("lineNumber", 4);
      (<AST.CompoundExpression>parsed).parts[1].code.should.have.property("lineNumber", 6);
    });
  });

  it("provides names for chunks of code", () => {
      let name = "test code";
      let parsed = BT.parse("line 1\nline 2", name);
      parsed.should.be.instanceOf(AST.CompoundExpression);
      (<AST.CompoundExpression>parsed).parts[0].code.chunk.should.equal(name);
  });

  describe("groups lines into hanging call bodies by leading whitespace", () => {
    var parsed = <AST.CompoundExpression>BT.parse(`
    with $a as:
     "in the block"
      "also in the block"
    $a`);

    parsed.parts.should.have.length(2); // hanging call + $a

    parsed.parts[0].should.be.an.instanceOf(AST.HangingCall);
    (<AST.HangingCall>parsed.parts[0]).body.parts.should.have.length(2);
  });

  it("throws an error when it encounters an empty hanging call body", () => {
    let attempt = () => <AST.CompoundExpression>BT.parse(`
    with $a as:
    print 2`);

    attempt.should.throw(MissingBodyError);
  });
});
