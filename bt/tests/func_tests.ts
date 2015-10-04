/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib';
import {BaseError} from '../lib/errors';
import * as evaluator from '../lib/evaluator';
import {FuncParams, FuncResult, Immediate} from '../lib/functions';
import {addSpyToScope} from './util';


class TestError extends BaseError {
}


describe('BackTalker function calls', () => {
    var scope: BT.Scope, evaluator: BT.Evaluator;

    beforeEach(() => {
        evaluator = new BT.Evaluator();
        scope = evaluator.scope;
    });

    describe("are comprised of bare words and expressions", () => {
        BT.parse("like this");

        it("which can include number literals as parameters", () => {
            BT.parse("like this 1");
        });

        it("which can include strings literals as parameters", () => {
            BT.parse('this is like "great"');
        });

        it("which can include parenthesized function calls as parameters", () => {
            BT.parse("I love this (not)");
        });
    });

    it("can retrieve arguments by name", () => {
        var spyFunc = addSpyToScope(scope);
        var result = evaluator.evalString("spy on 3 4") as FuncParams;
        result.named.should.have.property("a", 3);
        result.named.should.have.property("b", 4);
        spyFunc.calledOnce.should.be.ok;
    });

    it("can check for the existence of arguments by name", () => {
        addSpyToScope(scope, (args) => args.has("a"));
        evaluator.evalString("spy on 3").should.be.ok;
        evaluator.evalString("spy").should.not.be.ok;
    });

    it("can call a function with no arguments", () => {
        var func = addSpyToScope(scope, (a) => "cool");

        evaluator.evalString("spy").should.equal("cool");
        func.calledOnce.should.be.ok;
    });

    it("can call a function with arguments", () => {
        var func = addSpyToScope(scope, (a) => a.passed[0]);

        scope.set("cake", "yum!");
        evaluator.evalString("spy on $cake").should.equal("yum!");
        func.calledOnce.should.be.ok;
    });

    it("can call a function compoundly", () => {
        var func = addSpyToScope(scope, (a) => a.passed[0]);
        scope.set("cake", "yum!");
        evaluator.evalString("spy on $cake\nspy on $cake").should.equal("yum!");
        func.calledTwice.should.be.ok;
    });

    it("can name choices and find which was used", () => {
        var func = sinon.spy((a) => a.named.target);
        scope.addFunc(["bake <cake|pie>:target"], func);

        evaluator.evalString("bake cake").should.equal(0);
        evaluator.evalString("bake pie").should.equal(1);

        (() => evaluator.evalString("bake pants")).should.throw();
    });

    describe("can save you typing with patterns", () => {
        it("can allow choices of barewords like <foo|bar>", () => {
            scope.addFunc(["bake <cake|pie> $"], (a) => a.passed[0]);

            evaluator.evalString('bake cake "?"').should.equal("?");
            evaluator.evalString('bake pie "?"').should.equal("?");
        });

        it("can allow spaces in <|> like <foo or|foo and>", () => {
            scope.addFunc(["bake <cake and|pie or > $"], (a) => a.passed[0]);

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
        scope.addFunc(["on the planet $!"], func);

        var result = evaluator.evalString("on the planet $earth") as BT.AutoVar;
        result.should.be.instanceOf(BT.AutoVar);
        result.name.should.equal("earth");
        func.calledOnce.should.be.ok;

        evaluator.evalString('on the planet "not earth"').should.equal("not earth");
        func.calledTwice.should.be.ok;
    });

    it('can disallow autovivification', () => {
        scope.addFunc(["no"], () => false);
        should.throws(() => {
            evaluator.evalString('no $vivification');
        }, Error);
    })

    it('can allow for hanging calls by ending with :', () => {
        let hangingSpy = sinon.spy((args) => "hanging");
        let noHangingSpy = sinon.spy((args) => "simple");
        scope.addFunc(["test func :"], hangingSpy);
        scope.addFunc(["test func"], noHangingSpy);

        evaluator.evalString("test func").should.equal("simple");
        evaluator.evalString("test func:\n   5").should.equal("hanging");
    });

    it('can tell if it is making a block by checking args.body', () => {
        var body = false;

        scope.addFunc(["cool <|:>"], (args, self: BT.Evaluator) => {
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

                self.scope.addFunc(["I jump"], (args) => "jumped");
                let subEval = self.makeSub();
                let result = subEval.eval(args.body);
                gravity = subEval.scope.get('gravity');
                return result;
            });

        scope.addFunc(["on the planet $ :"], func);

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

    it('can call void functions without hanging', (done) => {
        var spyFunc = addSpyToScope(scope);
        var result = Immediate.wrap(evaluator.evalString("spy on 3 4")).then(() => {
            done();
        });
    });
});
