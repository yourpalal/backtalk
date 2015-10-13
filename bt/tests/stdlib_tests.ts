/// <reference path="../typings/tsd.d.ts" />
import 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/index';

let conditionSrc = `
when:
    $x and $y
    then:
        1
    $x or $y
    then:
        2
`;

describe('The BackTalker StdLib', () => {
    it('provides a print method that writes to env.stdout', () => {
        let bt = new BT.Evaluator();
        bt.scope.env.stdout.should.be.ok;
        sinon.spy(bt.scope.env.stdout, 'write');

        bt.evalString("print 3");
        bt.scope.env.stdout.write.calledWith(3).should.be.ok;
    });

    describe('provides a when function that replaces if/else', () => {
        it('can check a condition and do something if needed', () => {
            let bt = new BT.Evaluator();
            bt.scope.set('x', true);
            bt.scope.set('y', true);

            bt.evalString(conditionSrc).should.eql(1);

            bt.scope.set('x', false);
            bt.evalString(conditionSrc).should.eql(2);

            bt.scope.set('y', false);
            bt.evalString(conditionSrc).should.eql(false);
        });
    });
});
