/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/back_talker';


describe('BackTalker can', () => {
    var scope, evaluator;

    before(() => {
        evaluator = new BT.Evaluator();
        scope = evaluator.scope;
    });


    it("make loops", function(done) {
        scope.addFunc(["for $!:name from $:low to $:high"], function(args, ret) {
            let low = args.named.low,
                high = args.named.high,
                name = args.named.name,
                i = 0,
                results = new Array(high - low - 1);

            let step = () => {
              if (low + i >=  high) {
                return ret.set(results);
              }

              this.scope.set("i", i);
              this.eval(this.body).then((value) => {
                results[i] = value;
                i++;
                step();
              });
            };

            step();
        });

        var result = evaluator.evalString(`
        for $i from 0 to 10:
           $i + 5`);

        result.then((value) => {
          value.should.eql([5,6,7,8,9,10,11,12,13,14]);
          done();
        });
    });
});
