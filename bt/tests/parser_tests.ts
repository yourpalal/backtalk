/// <reference path="../typings/tsd.d.ts" />
import 'should';

import * as BT from '../lib/index';
import * as AST from '../lib/parser/ast';
import {MissingBodyError, ParseError} from '../lib/parser/parser';


describe("The BackTalker parser", () => {
    describe("provides line numers", () => {
        it("starting from 1", () => {
            var parsed = BT.parseOrThrow("line 1\nline 2");

            parsed.should.be.an.instanceOf(AST.CompoundExpression);
            (<AST.CompoundExpression>parsed).parts[0].code.should.have.property("lineNumber", 1);
            (<AST.CompoundExpression>parsed).parts[1].code.should.have.property("lineNumber", 2);
        });

        it("including blank lines", () => {
            var parsed = BT.parseOrThrow("\n\n\nline 4\n\nline 6");

            parsed.should.be.an.instanceOf(AST.CompoundExpression);
            (<AST.CompoundExpression>parsed).parts[0].code.should.have.property("lineNumber", 4);
            (<AST.CompoundExpression>parsed).parts[1].code.should.have.property("lineNumber", 6);
        });
    });

    it("provides names for chunks of code", () => {
        let name = "test code";
        let parsed = BT.parseOrThrow("line 1\nline 2", name);
        parsed.should.be.instanceOf(AST.CompoundExpression);
        (<AST.CompoundExpression>parsed).parts[0].code.chunk.should.equal(name);
    });

    it("groups lines into hanging call bodies by leading whitespace", () => {
        var parsed = <AST.CompoundExpression>BT.parseOrThrow(`
            with $a as:
             "in the block"
              "also in the block"
            $a`);

        parsed.parts.should.have.length(2); // hanging call + $a

        parsed.parts[0].should.be.an.instanceOf(AST.HangingCall);
        (<AST.HangingCall>parsed.parts[0]).body.parts.should.have.length(2);
    });

    it("throws an error when it encounters an empty hanging call body", () => {
        let attempt = () => <AST.CompoundExpression>BT.parseOrThrow(`
            with $a as:
            print 2`);

        attempt.should.throw(MissingBodyError);
    });

    it("can catch multiple syntax errors in the same chunk", () => {
        try {
            () => <AST.CompoundExpression>BT.parseOrThrow(`
            _GE - ;
            g-w9
            `);
        } catch (e) {
            e.should.be.instanceOf(ParseError);
            let pe = e as ParseError;
            pe.errors.should.have.length(2);
            pe.errors[0].line.should.eql(2);
            pe.errors[0].line.should.eql(3);
        }
    });

    it("replaces unparsed lines with syntax error AST items", () => {
        let {ast, errors} = BT.parse(`g09-g0-__9 g-0gs $ $ `);
        ast.parts.should.have.lengthOf(1);
        ast.parts[0].should.be.instanceOf(AST.SyntaxError);
        errors.should.have.length(1);
    });

    it("can throw ParseError when it can't parse something", () => {
        (() => BT.parseOrThrow("gowug987sd0f098")).should.throw(ParseError);
    });
});
