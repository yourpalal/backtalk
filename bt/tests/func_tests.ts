/// <reference path="../typings/tsd.d.ts" />

import should = require('should');
import sinon = require('sinon')

import BT = require('../lib/back_talker');
import evaluator = require('../lib/evaluator');


describe('BackTalker function calls', function() {
    var scope, evaluator, addSpy;

    beforeEach(function() {
        evaluator = new BT.Evaluator();
        scope = evaluator.scope;
        addSpy = sinon.spy(function(args) {
            var result = args.passed[0];
            for (var i = 1; i < args.passed.length; i++ ) {
                result += args.passed[i];
            }
            return result;
        });
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
        var func = sinon.spy(function(a) { return a; });
        scope.addFunc({
            patterns: ["look $:foo $:bar"],
            impl: func
        });

        var result = evaluator.evalString("look 3 4");
        result.named.should.have.property("foo", 3);
        result.named.should.have.property("bar", 4);
        func.calledOnce.should.be.ok;

    });

    it("can call a function with no arguments", function() {
        var func = sinon.stub().returns("cool");
        scope.addFunc({
            patterns: ["no args"],
            impl: func
        });

        evaluator.evalString("no args").should.equal("cool");
        func.calledOnce.should.be.ok;
    });

    it("can call a function with arguments", function() {
        var func = sinon.spy(function(a) { return a.passed[0]; });
        scope.addFunc({
            patterns: ["bake $"],
            impl: func
        });

        scope.set("cake", "yum!");
        evaluator.evalString("bake $cake").should.equal("yum!");
        func.calledOnce.should.be.ok;
    });

    it("can call a function compoundly", function() {
        var func = sinon.spy(function(a) { return a.passed[0]; });
        scope.addFunc({
            patterns: ["bake $"],
            impl: func
        });

        scope.set("cake", "yum!");
        evaluator.evalString("bake $cake\nbake $cake").should.equal("yum!");
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

        (function(){
            evaluator.evalString("bake pants");

        }).should.throw();
    });

    describe("can save you typing with patterns", function() {
        it("can allow choices of barewords like <foo|bar>", function() {
            scope.addFunc({
                patterns: ["bake <cake|pie> $"],
                impl: addSpy
            });

            // $-type args are defined first
            evaluator.evalString('bake cake "?"').should.equal("?");
            evaluator.evalString('bake pie "?"').should.equal("?");
        });

        it("can allow spaces in <|> like <foo or|foo and>", function() {
            scope.addFunc({
                patterns: ["bake <cake and|pie or > $"],
                impl: addSpy
            });

            evaluator.evalString('bake cake and "pie"').should.equal("pie");
            evaluator.evalString('bake pie or "cake"').should.equal("cake");
        });
    });

    it("is called with 'this' being the backtalker instance", function() {
        var func = sinon.spy(function() {
            return this;
        });
        scope.addFunc({
            patterns: ["get funky"],
            impl: func
        });


        var r = evaluator.evalString('get funky');

        r.should.be.an.instanceOf(BT.Evaluator);
        r.should.have.property('scope');
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