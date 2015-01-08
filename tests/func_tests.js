var BT = require('../back_talker')
    ,should = require('should')
    ,sinon = require('sinon')
;


describe('BackTalker function calls', function() {
    var scope, context, evaluator;

    before(function() {
        scope = new BT.Scope();
        context = new BT.Context();
        evaluator = new BT.Evaluator(scope, context);
    });

    it("syntactically, are comprised of bare words and expressions", function() {
        BT.parse("like this");        

        it("they can include number literals as parameters", function() {
            BT.parse("like this 1");
        });

        it("they can include strings literals as parameters", function() {
            BT.parse('this is like "great"');
        });

        it("they can include parenthesized function calls as parameters", function() {
            BT.parse("I love this (not)");
        });
    });

    it("can call a function with no arguments", function() {
        var func = sinon.stub().returns("cool");
        context.addFunc({
            patterns: ["no args"],
            impl: func
        });

        evaluator.evalString("no args").should.equal("cool");
        func.calledOnce.should.be.ok;
    });

    it("can call a function with arguments", function() {
        var func = sinon.spy(function(a) { return a; });
        context.addFunc({
            patterns: ["bake $"],
            impl: func
        });

        scope.set("cake", "yum!");
        evaluator.evalString("bake $cake").should.equal("yum!");
        func.calledOnce.should.be.ok;
    });

    it("can call a function compoundly", function() {
        var func = sinon.spy(function(a) { return a; });
        context.addFunc({
            patterns: ["bake $"],
            impl: func
        });

        scope.set("cake", "yum!");
        evaluator.evalString("bake $cake\nbake $cake").should.equal("yum!");
        func.calledTwice.should.be.ok;
    });

    it("can specify bareword patterns, and get the actuals", function() {
        var func = sinon.spy(function(a) { return a; });
        context.addFunc({
            patterns: ["bake <cake|pie>"],
            impl: func
        });

        evaluator.evalString("bake cake").should.equal("cake");
        evaluator.evalString("bake pie").should.equal("pie");

        (function(){
            evaluator.evalString("bake pants");

        }).should.throw();
    });

    it("can specify patterns with arguments", function() {
        var func = sinon.spy(function(a, b) { return a + b; });
        context.addFunc({
            patterns: ["bake <cake|pie> $"],
            impl: func
        });

        evaluator.evalString('bake cake "ok"').should.equal("okcake");
        evaluator.evalString('bake pie "ok"').should.equal("okpie");
    });
});
