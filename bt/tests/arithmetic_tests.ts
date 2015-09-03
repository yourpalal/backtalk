/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';

import * as BT from '../lib/back_talker';


describe('When doing math', () => {
    var bt_eval,
        scope;

    beforeEach(() => {
        var evaluator = new BT.Evaluator();
        scope = evaluator.scope;
        bt_eval = (s) => evaluator.evalString(s).get();
    });

    it('can understand integer literals', () => {
        bt_eval('5').should.equal(5);
        bt_eval('0').should.equal(0);
        bt_eval('1').should.equal(1);
    });

    it('can understand floating point literals', () => {
        bt_eval('1.23').should.equal(1.23);
        bt_eval('0.23').should.equal(0.23);
        bt_eval('90000.00').should.equal(90000.00);
    });

    it('can do addition', () => {
        bt_eval('1.23+2').should.equal(3.23);
        bt_eval('1.23+90').should.equal(91.23);
        bt_eval('20+400').should.equal(420);
        bt_eval('20+400+69').should.equal(489);
    });

    it('can do subtraction', () => {
        bt_eval('1.23-2').should.equal(-0.77);
        bt_eval('1.23-90').should.equal(-88.77);
        bt_eval('20-400').should.equal(-380);
        bt_eval('20-400-5-10-20').should.equal(-415);
    });

    it('can do division', () => {
        bt_eval('1.23/2').should.equal(1.23 / 2);
        bt_eval('1.23/90').should.equal(1.23 / 90);
        bt_eval('20/400').should.equal(20 / 400);
        bt_eval('20/400/3.6').should.equal(20 / 400 / 3.6);
    });

    it('can do multiplication', () => {
        bt_eval('1.23*2').should.equal(1.23 * 2);
        bt_eval('1.23*90').should.equal(1.23 * 90);
        bt_eval('20*400').should.equal(20 * 400);
        bt_eval('20*400*3.6').should.equal(20 * 400 * 3.6);
    });

    it('can do associative additions', () => {
        bt_eval('1+2+3').should.equal(6);

        bt_eval('1+2-3').should.equal(0);
        bt_eval('1+2-3+72').should.equal(72);
    });

    it('can deal with parens', () => {
        bt_eval('(3+4)').should.equal(7);
        bt_eval('(3+4)*(7*23)').should.equal(7*7*23);
    });

    it('can do mixed operations', () => {
        bt_eval('1.23*2-10').should.equal(1.23*2-10);
        bt_eval('1.23-2*10').should.equal(1.23-2*10);
        bt_eval('1.23-2*10').should.equal(1.23-2*10);
        bt_eval('2-8*3+4').should.equal(2-8*3+4);
        bt_eval('10/2-8*3+4/7-6').should.equal(10/2-8*3+4/7-6);
        bt_eval('10/(3*2-8)*3+4/7-6').should.equal(10/(3*2-8)*3+4/7-6);
    });

    it('can do mixed operations WITH SPACES', () => {
        bt_eval('1.23 * 2 - 10').should.equal(1.23*2 - 10);
        bt_eval('1.23 - 2 * 10').should.equal(1.23 - 2*10);
        bt_eval('1.23 - 2 * 10').should.equal(1.23 - 2*10);
        bt_eval('2 - 8 * 3 + 4').should.equal(2 - 8*3+4);
        bt_eval('10 / 2 - 8 * 3 + 4 / 7 - 6').should.equal(10/2 - 8*3+4/7 - 6);
        bt_eval('10 / (3 * 2 - 8) * 3 + 4 / 7 - 6').should.equal(10/(3*2 - 8)*3+4/7 - 6);
    });
});
