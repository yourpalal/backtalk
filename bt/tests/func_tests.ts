/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/back_talker';
import * as evaluator from '../lib/evaluator';
import {addSpyToScope} from "./util";


describe('BackTalker function calls', function() {
    var scope, evaluator;

    beforeEach(function() {
        evaluator = new BT.Evaluator();
        scope = evaluator.scope;
    });

    describe("are comprised of bare words and expressions", function() {
        BT.parse("like this");

        it("which can include number literals as parameters", function() {
            BT.parse("like this 1");
        });

        it("which can include strings literals as parameters", function() {
            BT.parse('this is like "great"');
        });

        it("which can include parenthesized function calls as parameters", function() {
            BT.parse("I love this (not)");
        });
    });

    it("can retrieve arguments by name", function() {
        var spyFunc = addSpyToScope(scope);
        var result = evaluator.evalString("spy on 3 4");
        result.named.should.have.property("a", 3);
        result.named.should.have.property("b", 4);
        spyFunc.calledOnce.should.be.ok;
    });

    it("can check for the existence of arguments by name", function() {
        addSpyToScope(scope, (args) => args.has("a"));
        evaluator.evalString("spy on 3").should.be.ok;
        evaluator.evalString("spy").should.not.be.ok;
    });

    it("can call a function with no arguments", function() {
        var func = addSpyToScope(scope, (a) => "cool");

        evaluator.evalString("spy").should.equal("cool");
        func.calledOnce.should.be.ok;
    });

    it("can call a function with arguments", function() {
        var func = addSpyToScope(scope, (a) => a.passed[0]);

        scope.set("cake", "yum!");
        evaluator.evalString("spy on $cake").should.equal("yum!");
        func.calledOnce.should.be.ok;
    });

    it("can call a function compoundly", function() {
        var func = addSpyToScope(scope, (a) => a.passed[0]);
        scope.set("cake", "yum!");
        evaluator.evalString("spy on $cake\nspy on $cake").should.equal("yum!");
        func.calledTwice.should.be.ok;
    });

    it("can name choices and find which was used", function() {
        var func = sinon.spy(function(a) { return a.named.target; });
        scope.addFunc({
            patterns: ["bake <cake|pie>:target"],
            impl: func
        });

        evaluator.evalString("bake cake").should.equal(0);
        evaluator.evalString("bake pie").should.equal(1);

        (() => evaluator.evalString("bake pants")).should.throw();
    });

    describe("can save you typing with patterns", function() {
        it("can allow choices of barewords like <foo|bar>", function() {
            scope.addFunc({
                patterns: ["bake <cake|pie> $"],
                impl: (a) => a.passed[0]
            });

            // $-type args are defined first
            evaluator.evalString('bake cake "?"').should.equal("?");
            evaluator.evalString('bake pie "?"').should.equal("?");
        });

        it("can allow spaces in <|> like <foo or|foo and>", function() {
            scope.addFunc({
                patterns: ["bake <cake and|pie or > $"],
                impl: (a) => a.passed[0]
            });

            evaluator.evalString('bake cake and "pie"').should.equal("pie");
            evaluator.evalString('bake pie or "cake"').should.equal("cake");
        });
    });

    it("is called with 'this' being the backtalker instance", function() {
        var func = addSpyToScope(scope, function() { return this; });
        var r = evaluator.evalString('spy on "this"');

        r.should.be.an.instanceOf(BT.Evaluator);
    });

    it('can allow for auto-vivified variables', function() {
        var func = sinon.spy(function(args) {
            return args.passed[0];
        });

        scope.addFunc({
            patterns: ["on the planet $!"],
            impl: func
        });

        var result = evaluator.evalString("on the planet $earth");
        result.should.be.instanceOf(BT.AutoVar);
        result.name.should.equal("earth");
        func.calledOnce.should.be.ok;

        evaluator.evalString('on the planet "not earth"').should.equal("not earth");
        func.calledTwice.should.be.ok;
    });

    it('can disallow autovivification', function() {
        scope.addFunc({
            patterns: ["no"],
            impl: function() {}
        });

        should.throws(function() {
            evaluator.evalString('no $vivification');
        }, Error);
    })

    it('can tell if it is making a block by checking newSubEval', function() {
        var newSubEval = false;

        scope.addFunc({
            patterns: ["cool"],
            impl: function() {
                var self = <evaluator.Evaluator>this;
                newSubEval = self.newSubEval;
                if (self.newSubEval) {
                    return self.eval(self.body);
                }
            }
        });

        evaluator.evalString("cool");
        newSubEval.should.not.be.ok;

        evaluator.evalString("cool:\n    5").should.equal(5);
        newSubEval.should.be.ok;

        // newSubEval false when called not with a block
        evaluator.evalString("cool:\n    cool");
        newSubEval.should.not.be.ok;
    });

    it('can create a new scope for a block of code', function() {
        var bodySyntax = null,
            gravity = 0,
            planet = null,
            func = sinon.spy(function(planet_in) {
                planet = planet_in.passed[0];
                bodySyntax = this.body;

                this.scope.addFunc({
                    patterns: ["I jump"],
                    impl: function(v, val) {
                        return "jumped";
                    }
                });

                var result = this.eval(this.body);
                gravity = this.scope.get("gravity");

                return result;
            });

        scope.addFunc({
            patterns: ["on the planet $"],
            impl: func
        });

        var code = ['on the planet "sarkon":',
                    '   with $gravity as 3 -- m/s/s',
                    '   I jump -- very high into the air'].join("\n")
            ,result = evaluator.evalString(code);

        func.calledOnce.should.be.ok;

        result.should.equal("jumped");
        planet.should.equal("sarkon");
        gravity.should.equal(3);

        bodySyntax.should.be.an.instanceOf(BT.Syntax.CompoundExpression);
    });
});
