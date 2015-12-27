/// <reference path="../typings/tsd.d.ts" />
import 'should';

import {CommandParam, CommandParams} from "../lib/commands";
import {BadTypeError} from "../lib/errors";


describe('the BackTalker command params obj', () => {
    var params: CommandParams, spec: CommandParam[];
    before(() => {
        spec = [
            CommandParam.forVar("int"),
            CommandParam.forVar("string"),
            CommandParam.forVar("null"),
            CommandParam.forVar("undefined"),
            CommandParam.forVar("obj"),
            CommandParam.forChoice("choice").withValue(0),
            CommandParam.forChoice("baz").withValue(1)
        ];

        params = new CommandParams([0, "wow", null, undefined, {"neat": 1}], spec);
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
