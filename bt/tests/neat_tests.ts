/// <reference path="../typings/tsd.d.ts" />
import 'should';

import * as BT from '../lib/index';


describe('BackTalker can', () => {
    var scope, evaluator;

    before(() => {
        evaluator = new BT.Evaluator();
        scope = evaluator.scope;
    });


    it("make loops", function(done) {
        scope.addFunc(["for $!:name from $:low to $:high :"], function(args) {
            let self = <BT.Evaluator>this;

            let low = args.named.low,
                high = args.named.high,
                name = args.named.name.name,
                i = 0,
                results = new Array(high - low - 1);

            return new Promise((resolve) => {
                let step = () => {
                    if (low + i >= high) {
                        return resolve(results);
                    }

                    self.scope.set(name, i);
                    BT.Immediate.wrap(self.makeSub().eval(args.body)).then((value) => {
                        results[i] = value;
                        i++;
                        step();
                    });
                };

                step();
            });

        });

        var result = evaluator.evalString(`
        for $i from 0 to 10:
           $i + 5`);

        result.then((value) => {
            value.should.eql([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
            done();
        });
    });
});
