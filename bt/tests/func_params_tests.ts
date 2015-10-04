/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';

import {FuncParam, FuncParams} from "../lib/functions";
import {BadTypeError} from "../lib/errors";


describe('the BackTalker func params obj', () => {
    var params: FuncParams, spec: FuncParam[];
    before(() => {
        spec = [
            FuncParam.forVar("int"),
            FuncParam.forVar("string"),
            FuncParam.forChoice("choice").withValue(0),
            FuncParam.forChoice("baz").withValue(1)
        ];

        params = new FuncParams([0, "wow"], spec);
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
    });
});
