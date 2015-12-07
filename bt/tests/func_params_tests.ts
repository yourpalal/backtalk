/// <reference path="../typings/tsd.d.ts" />
import 'should';

import {FuncParam, FuncParams} from "../lib/functions";
import {BadTypeError} from "../lib/errors";


describe('the BackTalker func params obj', () => {
    var params: FuncParams, spec: FuncParam[];
    before(() => {
        spec = [
            FuncParam.forVar("int"),
            FuncParam.forVar("string"),
            FuncParam.forVar("null"),
            FuncParam.forVar("undefined"),
            FuncParam.forVar("obj"),
            FuncParam.forChoice("choice").withValue(0),
            FuncParam.forChoice("baz").withValue(1)
        ];

        params = new FuncParams([0, "wow", null, undefined, {"neat": 1}], spec);
    });

    it('can check if parameters exist', () => {
        params.has("int").should.be.ok;
        params.has("nope").should.not.be.ok;
    });

    it('can make sure parameters are correctly typed', () => {
        params.hasNumber("int").should.be.ok;
        params.hasNumber("string").should.not.be.ok;
        params.hasNumber("nope").should.not.be.ok;
        params.getNumber("int").should.equal(0);
        (() => params.getNumber("string")).should.throw(BadTypeError);

        params.hasString("string").should.be.ok;
        params.hasString("int").should.not.be.ok;
        params.hasString("nope").should.not.be.ok;
        params.getString("string").should.equal("wow");
        (() => params.getString("int")).should.throw(BadTypeError);

        // strings and ints are objects too!
        params.hasObject("string").should.be.ok;
        params.hasObject("int").should.be.ok;
        params.hasObject("nope").should.not.be.ok;
        params.hasObject("obj").should.be.ok;

    });

    it('reject null or undefined values', () => {
        params.hasNumber("null").should.not.be.ok;
        params.hasNumber("undefined").should.not.be.ok;

        params.hasString("null").should.not.be.ok;
        params.hasString("undefined").should.not.be.ok;

        params.hasObject("null").should.not.be.ok;
        params.hasObject("undefined").should.not.be.ok;

        (() => params.getString("null").should.throw(BadTypeError));
        (() => params.getString("undefined").should.throw(BadTypeError));

        (() => params.getNumber("null").should.throw(BadTypeError));
        (() => params.getNumber("undefined").should.throw(BadTypeError));

        (() => params.getObject("null").should.throw(BadTypeError));
        (() => params.getObject("undefined").should.throw(BadTypeError));
    });
});
