/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/index';
import {BaseError} from '../lib/errors';
import {CommandParams} from '../lib/commands';
import {Immediate} from '../lib/immediate';
import {addSpyToScope} from './util';


class TestError extends BaseError {
}


describe('BackTalker commands', () => {
    var scope: BT.Scope, evaluator: BT.Evaluator;

    beforeEach(() => {
        evaluator = new BT.Evaluator();
        scope = evaluator.scope;
    });

    describe("are comprised of bare words and expressions", () => {
        BT.parseOrThrow("like this");

        it("which can include number literals as parameters", () => {
            BT.parseOrThrow("like this 1");
        });

        it("which can include strings literals as parameters", () => {
            BT.parseOrThrow('this is like "great"');
        });

        it("which can include parenthesized commands as parameters", () => {
            BT.parseOrThrow("I love this (not)");
        });

        it("which can include parenthesized math as parameters", () => {
            BT.parseOrThrow("wow (3 + 3)");
        });

        it("can start with a $ref if the next part is a bare word", () => {
            scope.addCommand(["$:name is cool"], (args, self) => args.get("name"));
            evaluator.evalString("with $x as 5\n$x is cool").should.eql(5);
        });
    });

    it("can retrieve arguments by name", () => {
        var spyFunc = addSpyToScope(scope);
        var result = evaluator.evalString("spy on 3 4") as CommandParams;
        result.named.should.have.property("a", 3);
        result.named.should.have.property("b", 4);
        spyFunc.calledOnce.should.be.ok;
    });

    it("can check for the existence of arguments by name", () => {
        addSpyToScope(scope, (args) => args.has("a"));
        evaluator.evalString("spy on 3").should.be.ok;
        evaluator.evalString("spy").should.not.be.ok;
    });

    it("can call a command with no arguments", () => {
        var func = addSpyToScope(scope, (a) => "cool");

        evaluator.evalString("spy").should.equal("cool");
        func.calledOnce.should.be.ok;
    });

    it("can call a command with arguments", () => {
        var func = addSpyToScope(scope, (a) => a.passed[0]);

        scope.set("cake", "yum!");
        evaluator.evalString("spy on $cake").should.equal("yum!");
        func.calledOnce.should.be.ok;
    });

    it("can call a command compoundly", () => {
        var func = addSpyToScope(scope, (a) => a.passed[0]);
        scope.set("cake", "yum!");
        evaluator.evalString("spy on $cake\nspy on $cake").should.equal("yum!");
        func.calledTwice.should.be.ok;
    });

    it("can name choices and find which was used", () => {
        var func = sinon.spy((a) => a.named.target);
        scope.addCommand(["bake <cake|pie>:target"], func);

        evaluator.evalString("bake cake").should.equal(0);
        evaluator.evalString("bake pie").should.equal(1);

        (() => evaluator.evalString("bake pants")).should.throw();
    });

    describe("can save you typing with patterns", () => {
        it("can allow choices of barewords like <foo|bar>", () => {
            scope.addCommand(["bake <cake|pie> $"], (a) => a.passed[0]);

            evaluator.evalString('bake cake "?"').should.equal("?");
            evaluator.evalString('bake pie "?"').should.equal("?");
        });

        it("can allow spaces in <|> like <foo or|foo and>", () => {
            scope.addCommand(["bake <cake and|pie or > $"], (a) => a.passed[0]);

            evaluator.evalString('bake cake and "pie"').should.equal("pie");
            evaluator.evalString('bake pie or "cake"').should.equal("cake");
        });
    });

    it("is called with 'this' being the backtalker instance", () => {
        addSpyToScope(scope, function(a) { return this; });
        evaluator.evalString('spy on "this"').should.be.an.instanceOf(BT.Evaluator);
    });

    it('can allow for auto-vivified variables', () => {
        var func = sinon.spy((args) => args.passed[0]);
        scope.addCommand(["on the planet $!"], func);

        var result = evaluator.evalString("on the planet $earth") as BT.AutoVar;
        result.should.be.instanceOf(BT.AutoVar);
        result.name.should.equal("earth");
        func.calledOnce.should.be.ok;

        evaluator.evalString('on the planet "not earth"').should.equal("not earth");
        func.calledTwice.should.be.ok;
    });

    it('can disallow autovivification', () => {
        scope.addCommand(["no"], () => false);
        should.throws(() => {
            evaluator.evalString('no $vivification');
        }, Error);
    });

    it('can allow for hanging calls by ending with :', () => {
        let hangingSpy = sinon.spy((args) => "hanging");
        let noHangingSpy = sinon.spy((args) => "simple");
        scope.addCommand(["test func :"], hangingSpy);
        scope.addCommand(["test func"], noHangingSpy);

        evaluator.evalString("test func").should.equal("simple");
        evaluator.evalString("test func:\n   5").should.equal("hanging");
    });

    it('can tell if it is making a block by checking args.body', () => {
        var body = false;

        scope.addCommand(["cool <|:>"], (args, self: BT.Evaluator) => {
            body = args.body !== null;
            if (body) {
                return self.makeSub().eval(args.body);
            } else {
                return null;
            }
        });

        evaluator.evalString("cool");
        body.should.not.be.ok;

        evaluator.evalString("cool:\n    5").should.equal(5);
        body.should.be.ok;

        // body false when called not with a block
        evaluator.evalString("cool:\n    cool");
        body.should.not.be.ok;
    });

    it('can create a new scope for a block of code', () => {
        var bodySyntax = null,
            gravity = 0,
            planet = null,
            func = sinon.spy(function(args, self: BT.Evaluator) {
                planet = args.passed[0];
                bodySyntax = args.body;

                self.scope.addCommand(["I jump"], () => "jumped");
                let subEval = self.makeSub();
                let result = subEval.eval(args.body);
                gravity = subEval.scope.get('gravity');
                return result;
            });

        scope.addCommand(["on the planet $ :"], func);

        var code = ['on the planet "sarkon":',
            '   with $gravity as 3 -- m/s/s',
            '   I jump -- very high into the air'].join("\n")
            , result = evaluator.evalString(code);

        func.calledOnce.should.be.ok;

        result.should.equal("jumped");
        planet.should.equal("sarkon");
        gravity.should.equal(3);

        bodySyntax.should.be.an.instanceOf(BT.AST.CompoundExpression);
    });

    it('can communicate with other commands by modifying scope.env', () => {
        scope.addCommand(["set the secret"], (args, self) => self.scope.env['secret'] = "wow");
        scope.addCommand(["get the secret"], (args, self) => self.scope.env['secret']);

        evaluator.evalString("set the secret\nget the secret").should.eql("wow");
    });

    it('can call void commands without hanging', (done) => {
        addSpyToScope(scope, () => undefined);
        Immediate.resolve(evaluator.evalString("spy on 3 4")).then(() => {
            done();
        });
    });
});
