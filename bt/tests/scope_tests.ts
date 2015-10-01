/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';

import * as BT from '../lib';


describe('BackTalker scopes', () => {
    var scope;

    beforeEach(() => {
        scope = BT.StdLib.inScope(new BT.Scope());
    });

    it('can inherit from their parents', () => {
        scope.set("weird", 5);
        scope.has("weird").should.be.ok;
        scope.get("weird").should.equal(5);

        var sub = scope.createSubScope();
        sub.get("weird").should.equal(5);
    });

    it('can override the parent scope', () => {
        scope.set("weird", 5);
        scope.get("weird").should.equal(5);

        var sub = scope.createSubScope();
        sub.set("weird", 6);
        sub.get("weird").should.equal(6);
        scope.get("weird").should.equal(5);
    });

    it('can modify scope in BT', () => {
        BT.eval('with $test as 3', scope);
        scope.get("test").should.equal(3);

        scope.set("test", 5);
        BT.eval("$test", scope).get().should.equal(5);
    });

    it('can change values', () => {
        BT.eval('with $test as 3', scope).get().should.equal(3);
        scope.get("test").should.equal(3);

        BT.eval('with $test as 5', scope).get().should.equal(5);
        scope.get("test").should.equal(5);
    });

    it('can do math with references', () => {
        BT.eval('with $test as 3', scope);
        BT.eval('with $a as 7', scope);
        scope.get("test").should.equal(3);
        scope.get("a").should.equal(7);

        BT.eval('$test + 7', scope).get().should.equal(10);
        BT.eval('$test * 7', scope).get().should.equal(21);

        BT.eval('$test + $a', scope).get().should.equal(10);
        BT.eval('$test * $a', scope).get().should.equal(21);
    });

    it('can use scope in compound expressions', () => {
        BT.eval('with $test as 3\n$test', scope).get().should.equal(3);
        BT.eval('with $test as 3\n$test + 5', scope).get().should.equal(8);
        BT.eval('with $test as 3\n\n$test + 5', scope).get().should.equal(8);
    });
});
