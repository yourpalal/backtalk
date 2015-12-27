/// <reference path="../typings/tsd.d.ts" />
import 'should';

import * as BT from '../lib/index';
import {BaseError} from '../lib/errors';
import {CommandParams} from '../lib/commands';


class TestError extends BaseError {
}


describe('BackTalker Libraries', () => {
    var scope: BT.Scope, evaluator: BT.Evaluator;

    beforeEach(() => {
        evaluator = new BT.Evaluator();
        scope = evaluator.scope;
    });

    it("can add a reference to a scope", () => {
        var lib = BT.Library.create()
            .ref("bar", 3)
            .done();

        lib.addToScope(scope);
        scope.get("bar").should.eql(3);
    });

    it("can add a function to calculate a reference in addToScope", () => {
        var lib = BT.Library.create()
            .ref("bar", () => 3)
            .done();

        lib.addToScope(scope);
        scope.get("bar").should.eql(3);
    });

    it("can add a reference via addToScope", () => {
        var lib = BT.Library.create()
            .done();

        lib.addToScope(scope, {}, {
            bar: 3
        });
        scope.get("bar").should.eql(3);
    });

    it("can add a command to a scope", () => {
        var lib = BT.Library.create()
            .command("foo", ["foo <bar|baz>:barbaz"])
                .help('Returns either 1 or 2')
                .impl((args: CommandParams, self: BT.Evaluator) => {
                    return args.getNumber("barbaz") + 1;
                })
            .done()
        ;

        lib.addToScope(scope);
        scope.findCommand("foo bar").should.be.ok;
        evaluator.evalString("foo bar").should.eql(1);
    });

    it("can add hanging commands to a scope", () => {
        BT.Library.create()
            .command("bar", ["bar:"])
                .help("runs the body with the variable $bar")
                .callsBody(BT.Library.ONCE)
                .impl(() => "wow")
                .includes()
                    .command("foo", ["foo"])
                    .help("returns 'bar'")
                    .impl(() => "bar")
                .done()
            .done()
            .addToScope(scope)
        ;

        scope.findCommand("bar :").should.be.ok;
    });

    it("can set command implementations during addToScope", () => {
        BT.Library.create()
            .command("bar", ["bar"])
                .impl(() => "wow")
            .command("baz", ["baz"])
            .command("boop", ["boop"])
            .done()
            .addToScope(scope, {
                bar: () => "bar",
                baz: () => "baz"
            });

        evaluator.evalString("bar").should.eql("bar");
        evaluator.evalString("baz").should.eql("baz");
        (scope.findCommand("boop") === null).should.be.ok;
    });

    it("adds metadata to the scope", () => {
        let help = "runs the body with the variable $bar";
        BT.Library.create()
            .command("bar", ["bar :"])
                .help(help)
                .impl(() => "wow")
            .done()
            .addToScope(scope);
        scope.findCommand("bar :").meta.help.should.be.exactly(help);
    });
});
