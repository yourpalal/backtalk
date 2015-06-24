/// <reference path="../typings/tsd.d.ts" />

import should = require('should');
import sinon = require('sinon');

import BT = require('../lib/back_talker');


it('BackTalker can', function() {
    var scope, evaluator;

    before(function() {
        evaluator = new BT.Evaluator();
        scope = evaluator.scope;
    });


    it("make loops", function() {
        scope.addFunc({
            patterns: ["for $! from $ to $"]
            ,impl: function(v, low, high) {
                var i = 0,
                    results = [];

                for (; low + i < high; i++) {
                    this.scope.set(v.name, low + i);
                    results.push(this.eval(this.body));
                }
                return results;
            }
        });

        var result = evaluator.eval([
        "for $i from 0 to 10:",
        "   $i + 5"
        ].join("\n"));

        result.should.equal([5,6,7,8,9,10,11,12,13,14]);
    });
});