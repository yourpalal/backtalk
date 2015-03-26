var BT = require('../back_talker')
    ,should = require('should')
    ,sinon = require('sinon')
;


describe('BackTalker function calls', function() {
    var scope, evaluator;

    before(function() {
        scope = new BT.Scope();
        evaluator = new BT.Evaluator(scope);
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
        var func = sinon.spy(function(a) { return a; });
        scope.addFunc({
            patterns: ["bake $"],
            impl: func
        });

        scope.set("cake", "yum!");
        evaluator.evalString("bake $cake").should.equal("yum!");
        func.calledOnce.should.be.ok;
    });

    it("can call a function compoundly", function() {
        var func = sinon.spy(function(a) { return a; });
        scope.addFunc({
            patterns: ["bake $"],
            impl: func
        });

        scope.set("cake", "yum!");
        evaluator.evalString("bake $cake\nbake $cake").should.equal("yum!");
        func.calledTwice.should.be.ok;
    });

    it("can specify bareword patterns, and get the actuals", function() {
        var func = sinon.spy(function(a) { return a; });
        scope.addFunc({
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
        scope.addFunc({
            patterns: ["bake <cake|pie> $"],
            impl: func
        });

        evaluator.evalString('bake cake "ok"').should.equal("okcake");
        evaluator.evalString('bake pie "ok"').should.equal("okpie");
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

    it('can create a new scope for a block of code', function() {
        var bodyAST = null,
            func = sinon.spy(function(body, a) {
                bodyAST = body;

                return a;
            });

        scope.addFunc({
            patterns: ["on the planet $"],
            impl: func
        });

        var code = ['on the planet "sarkon":',
                    '   with $gravity being 3 -- m/s',
                    '   I jump -- very high into the air'].join("\n")
            ,result = evaluator.evalString(code);
    
        func.calledOnce.should.be.ok;
        result.should.equal("sarkon");
        bodyAST.should.be.an.instanceOf(BT.AST.CompoundExpression);
    });
});
