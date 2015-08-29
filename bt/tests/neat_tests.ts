/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/back_talker';


describe('BackTalker can', function() {
    var scope, evaluator;

    before(function() {
        evaluator = new BT.Evaluator();
        scope = evaluator.scope;
    });


    it("make loops", function(done) {
        scope.addFunc({
            patterns: ["for $! from $ to $"]
            ,impl: function(args, ret) {
                let low = args.named.low,
                    high = args.named.high,
                    name = args.named.name,
                    i = 0,
                    results = [];

                let step = () => {
                  if (low + i >=  high) {
                    ret.set(results);
                    return;
                  }

                  this.eval(this.body).then((value) => {
                    results.push(value);
                    i++;
                    step();
                  });
                }

                step();
            }
        });

        var result = evaluator.evalString(`
        for $i from 0 to 10:
           $i + 5`);

        result.then((value) => {
          value.should.equal([5,6,7,8,9,10,11,12,13,14]);
          done();
        });
    });
});
