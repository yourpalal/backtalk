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

});
