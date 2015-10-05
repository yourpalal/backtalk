/// <reference path="../typings/tsd.d.ts" />
import * as sinon from 'sinon';

import * as BT from '../lib/index';


let src = `
with $a as 3
print $a
100`;

describe('The BackTalker Evaluator', () => {
    it('can compile code and store the result', () => {
        let bt = new BT.Evaluator();
        bt.hasCompiled("/evaluator_tests/store").should.not.be.ok;
        bt.compile(src, "/evaluator_tests/store");
        bt.hasCompiled("/evaluator_tests/store").should.be.ok;
    });

    it('can compile code and then run it by name', () => {
        let bt = new BT.Evaluator();
        bt.compile(src, "/evaluator_tests/store");
        bt.hasCompiled("/evaluator_tests/store");

        bt.runForResult('/evaluator_tests/store').should.eql(100);
        // can also run from subevaluators
        bt.makeSub().runForResult('/evaluator_tests/store').should.eql(100);
    });
});
