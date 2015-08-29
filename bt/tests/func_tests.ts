/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/back_talker';
import * as evaluator from '../lib/evaluator';
import {addSpyToScope} from './util';
import {FuncResult} from '../lib/functions';


describe('BackTalker function calls', function() {
    var scope: BT.Scope, evaluator: BT.Evaluator;

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
        var result = evaluator.evalString("spy on 3 4").get();
        result.named.should.have.property("a", 3);
        result.named.should.have.property("b", 4);
        spyFunc.calledOnce.should.be.ok;
    });

    it("can check for the existence of arguments by name", function() {
        addSpyToScope(scope, (args, ret) => ret.set(args.has("a")));
        evaluator.evalString("spy on 3").get().should.be.ok;
        evaluator.evalString("spy").get().should.not.be.ok;
    });

    it("can call a function with no arguments", function() {
        var func = addSpyToScope(scope, (a, ret) => ret.set("cool"));

        evaluator.evalString("spy").get().should.equal("cool");
        func.calledOnce.should.be.ok;
    });

    it("can call a function with arguments", function() {
        var func = addSpyToScope(scope, (a, ret) => ret.set(a.passed[0]));

        scope.set("cake", "yum!");
        evaluator.evalString("spy on $cake").get().should.equal("yum!");
        func.calledOnce.should.be.ok;
    });

    it("can call a function compoundly", function() {
        var func = addSpyToScope(scope, (a, ret) => ret.set(a.passed[0]));
        scope.set("cake", "yum!");
        evaluator.evalString("spy on $cake\nspy on $cake").get().should.equal("yum!");
        func.calledTwice.should.be.ok;
    });

    it("can name choices and find which was used", function() {
        var func = sinon.spy((a, ret) => { ret.set(a.named.target); });
        scope.addFunc(["bake <cake|pie>:target"], func);

        evaluator.evalString("bake cake").get()
          .should.equal(0);
        evaluator.evalString("bake pie").get()
          .should.equal(1);

        (() => evaluator.evalString("bake pants")).should.throw();
    });

    describe("can save you typing with patterns", function() {
        it("can allow choices of barewords like <foo|bar>", function() {
            scope.addFunc(["bake <cake|pie> $"], (a, ret) => ret.set(a.passed[0]));

            evaluator.evalString('bake cake "?"').get()
              .should.equal("?");
            evaluator.evalString('bake pie "?"').get().
              should.equal("?");
        });

        it("can allow spaces in <|> like <foo or|foo and>", function() {
            scope.addFunc(["bake <cake and|pie or > $"], (a, ret) => ret.set(a.passed[0]));

            evaluator.evalString('bake cake and "pie"').get()
              .should.equal("pie");
            evaluator.evalString('bake pie or "cake"').get()
              .should.equal("cake");
        });
    });

    it("is called with 'this' being the backtalker instance", function() {
        addSpyToScope(scope, function(a, ret) { ret.set(this); });
        evaluator.evalString('spy on "this"').get()
          .should.be.an.instanceOf(BT.Evaluator);
    });

    it('can allow for auto-vivified variables', function() {
        var func = sinon.spy(function(args, ret) {
            ret.set(args.passed[0]);
        });
        scope.addFunc(["on the planet $!"], func);

        var result = evaluator.evalString("on the planet $earth").get();
        result.should.be.instanceOf(BT.AutoVar);
        result.name.should.equal("earth");
        func.calledOnce.should.be.ok;

        evaluator.evalString('on the planet "not earth"')
          .get().should.equal("not earth");
        func.calledTwice.should.be.ok;
    });

    it('can disallow autovivification', function() {
        scope.addFunc(["no"], () => false);
        should.throws(function() {
            evaluator.evalString('no $vivification');
        }, Error);
    })

    it('can tell if it is making a block by checking newSubEval', function() {
        var newSubEval = false;

        scope.addFunc(["cool"], function(args, ret) {
          var self = <evaluator.Evaluator>this;
          newSubEval = self.newSubEval;
          if (self.newSubEval) {
              ret.resolve(self.eval(self.body));
          }
        });

        evaluator.evalString("cool");
        newSubEval.should.not.be.ok;

        evaluator.evalString("cool:\n    5").get().should.equal(5);
        newSubEval.should.be.ok;

        // newSubEval false when called not with a block
        evaluator.evalString("cool:\n    cool");
        newSubEval.should.not.be.ok;
    });

    it('can create a new scope for a block of code', function() {
        var bodySyntax = null,
            gravity = 0,
            planet = null,
            func = sinon.spy(function(args, ret) {
                planet = args.passed[0];
                bodySyntax = this.body;

                this.scope.addFunc(["I jump"], (args, ret) => ret.set("jumped"));
                var result = this.eval(this.body).get();
                gravity = this.scope.get("gravity");
                ret.set(result);
            });

        scope.addFunc(["on the planet $"], func);

        var code = ['on the planet "sarkon":',
                    '   with $gravity as 3 -- m/s/s',
                    '   I jump -- very high into the air'].join("\n")
            ,result = evaluator.evalString(code);

        func.calledOnce.should.be.ok;

        result.get().should.equal("jumped");
        planet.should.equal("sarkon");
        gravity.should.equal(3);

        bodySyntax.should.be.an.instanceOf(BT.Syntax.CompoundExpression);
    });

    describe("return via promise-like the FuncResult, which", function() {
      it('can be used synchronously with get()', function() {
        let result = new FuncResult();
        result.set("wow");
        result.get().should.equal("wow");
      });

      it('throws an error if get() is called before set()', function() {
        let result = new FuncResult();
        (function() {
          console.log(result.get());
        }).should.throw();
      });

      it('can be resolved via another FuncResult', function(done) {
        let result = new FuncResult();
        let other = new FuncResult();
        result.resolve(other);

        other.set("wow");

        result.then((value) => {
          value.should.equal("wow");
          done();
        });
      });
    });

    it('can be listened to asyncrhonously with then', function(done) {
        let result = new FuncResult();

        result.then((value) => {
          value.should.equal("wow");
          done();
        });
        result.set("wow");
    });
});
