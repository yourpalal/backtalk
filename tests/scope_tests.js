var BT = require('../back_talker')
    ,should = require('should')
;


describe('BackTalker scopes', function() {
    var scope;

    before(function() {
        scope = new BT.Scope();
    });

    it('can inherit from their parents', function() {
        scope.set("weird", 5);
        scope.get("weird").should.equal(5);

        var sub = scope.createSubScope();
        sub.get("weird").should.equal(5);
    });

    it('can override the parent scope', function() {
        scope.set("weird", 5);
        scope.get("weird").should.equal(5);

        var sub = scope.createSubScope();
        sub.set("weird", 6);
        sub.get("weird").should.equal(6);
        scope.get("weird").should.equal(5);
    });

    it('can modify scope in BT', function() {
        BT.eval('with $test as 3', scope);
        scope.get("test").should.equal(3);

        scope.set("test", 5);
        BT.eval("$test", scope).should.equal(5);
    });

    it('can do math with references', function() {
        BT.eval('with $test as 3', scope);
        BT.eval('with $a as 7', scope);
        scope.get("test").should.equal(3);
        
        BT.eval('$test + 7', scope).should.equal(10);
        BT.eval('$test * 7', scope).should.equal(21);

        BT.eval('$test + $a', scope).should.equal(10);
        BT.eval('$test * $a', scope).should.equal(21);
    });
});
