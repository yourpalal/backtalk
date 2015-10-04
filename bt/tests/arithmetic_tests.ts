/// <reference path="../typings/tsd.d.ts" />
import 'should';

import * as BT from '../lib/index';


describe('When doing math', () => {
    var btEval,
        scope;

    beforeEach(() => {
        var evaluator = new BT.Evaluator();
        scope = evaluator.scope;
        btEval = (s) => evaluator.evalString(s);
    });

    it('can understand integer literals', () => {
        btEval('5').should.equal(5);
        btEval('0').should.equal(0);
        btEval('1').should.equal(1);
    });

    it('can understand floating point literals', () => {
        btEval('1.23').should.equal(1.23);
        btEval('0.23').should.equal(0.23);
        btEval('90000.00').should.equal(90000.00);
    });

    it('can do addition', () => {
        btEval('1.23+2').should.equal(3.23);
        btEval('1.23+90').should.equal(91.23);
        btEval('20+400').should.equal(420);
        btEval('20+400+69').should.equal(489);
    });

    it('can do subtraction', () => {
        btEval('1.23-2').should.equal(-0.77);
        btEval('1.23-90').should.equal(-88.77);
        btEval('20-400').should.equal(-380);
        btEval('20-400-5-10-20').should.equal(-415);
    });

    it('can do division', () => {
        btEval('1.23/2').should.equal(1.23 / 2);
        btEval('1.23/90').should.equal(1.23 / 90);
        btEval('20/400').should.equal(20 / 400);
        btEval('20/400/3.6').should.equal(20 / 400 / 3.6);
    });

    it('can do multiplication', () => {
        btEval('1.23*2').should.equal(1.23 * 2);
        btEval('1.23*90').should.equal(1.23 * 90);
        btEval('20*400').should.equal(20 * 400);
        btEval('20*400*3.6').should.equal(20 * 400 * 3.6);
    });

    it('can do associative additions', () => {
        btEval('1+2+3').should.equal(6);

        btEval('1+2-3').should.equal(0);
        btEval('1+2-3+72').should.equal(72);
    });

    it('can deal with parens', () => {
        btEval('(3+4)').should.equal(7);
        btEval('(3+4)*(7*23)').should.equal(7 * 7 * 23);
    });

    it('can do mixed operations', () => {
        btEval('1.23*2-10').should.equal(1.23 * 2 - 10);
        btEval('1.23-2*10').should.equal(1.23 - 2 * 10);
        btEval('1.23-2*10').should.equal(1.23 - 2 * 10);
        btEval('2-8*3+4').should.equal(2 - 8 * 3 + 4);
        btEval('10/2-8*3+4/7-6').should.equal(10 / 2 - 8 * 3 + 4 / 7 - 6);
        btEval('10/(3*2-8)*3+4/7-6').should.equal(10 / (3 * 2 - 8) * 3 + 4 / 7 - 6);
    });

    it('can do mixed operations WITH SPACES', () => {
        btEval('1.23 * 2 - 10').should.equal(1.23 * 2 - 10);
        btEval('1.23 - 2 * 10').should.equal(1.23 - 2 * 10);
        btEval('1.23 - 2 * 10').should.equal(1.23 - 2 * 10);
        btEval('2 - 8 * 3 + 4').should.equal(2 - 8 * 3 + 4);
        btEval('10 / 2 - 8 * 3 + 4 / 7 - 6').should.equal(10 / 2 - 8 * 3 + 4 / 7 - 6);
        btEval('10 / (3 * 2 - 8) * 3 + 4 / 7 - 6').should.equal(10 / (3 * 2 - 8) * 3 + 4 / 7 - 6);
    });
});
