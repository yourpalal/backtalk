/// <reference path="../typings/tsd.d.ts" />
import 'should';

import * as BT from '../lib/index';
import {BaseError} from '../lib/errors';
import {FuncParams} from '../lib/functions';


class TestError extends BaseError {
}


describe('BackTalker function calls', () => {
    var scope: BT.Scope, evaluator: BT.Evaluator;

    beforeEach(() => {
        evaluator = new BT.Evaluator();
        scope = evaluator.scope;
    });

    it("can add a function to a scope", () => {
        var lib = BT.Library.create()
            .func("foo", ["foo <bar|baz>:barbaz"])
                .help('Returns either 1 or 2')
                .impl((args: FuncParams, self: BT.Evaluator) => {
                    return args.getNumber("barbaz") + 1;
                })
            .done()
        ;

        lib.addToScope(scope);
        scope.findFunc("foo bar").should.be.ok;
        evaluator.evalString("foo bar").should.eql(1);
    });

    it("can add hanging functions to a scope", () => {
        BT.Library.create()
            .func("bar", ["bar:"])
                .help("runs the body with the variable $bar")
                .callsBody(BT.Library.ONCE)
                .impl(() => "wow")
                .includes()
                    .func("foo", ["foo"])
                    .help("returns 'bar'")
                    .impl(() => "bar")
                .done()
            .done()
            .addToScope(scope)
        ;

        scope.findFunc("bar :").should.be.ok;
    });

    it("adds metadata to the scope", () => {
        let help = "runs the body with the variable $bar";
        BT.Library.create()
            .func("bar", ["bar :"])
                .help(help)
                .impl(() => "wow")
            .done()
            .addToScope(scope);
        scope.findFunc("bar :").meta.help.should.be.exactly(help);
    });
});
