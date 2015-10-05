/// <reference path="../typings/tsd.d.ts" />
import 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/index';

describe('The BackTalker StdLib', () => {
    it('provides a print method that writes to env.stdout', () => {
        let bt = new BT.Evaluator();
        bt.scope.env.stdout.should.be.ok;
        sinon.spy(bt.scope.env.stdout, 'write');

        bt.evalString("print 3");
        bt.scope.env.stdout.write.calledWith(3).should.be.ok;
    });
});
