/// <reference path="../typings/tsd.d.ts" />
import 'should';

import * as BT from '../lib/index';


describe('When doing boolean arithmetic', () => {
    var btEval,
        scope;

    beforeEach(() => {
        var evaluator = new BT.Evaluator();
        scope = evaluator.scope;
        btEval = (s) => evaluator.evalString(s);
    });

    it('can understand boolean literals', () => {
        btEval('true').should.equal(true);
        btEval('false').should.equal(false);
    });

    it('can do ors', () => {
        btEval('true or true').should.equal(true);
        btEval('true or false').should.equal(true);
        btEval('false or true').should.equal(true);
        btEval('false or false').should.equal(false);
        btEval('false or false or true').should.equal(true);
    });

    it('can do ands', () => {
        btEval('true and true').should.equal(true);
        btEval('true and false').should.equal(false);
        btEval('false and true').should.equal(false);
        btEval('false and false').should.equal(false);
        btEval('false and false and true').should.equal(false);
        btEval('true and true and true').should.equal(true);
    });

    it('can do negation', () => {
        btEval('not true').should.equal(false);
    });

    it('can do negation with ands/ors', () => {
        btEval('true and not false').should.equal(true);
        btEval('false or not false and not true').should.equal(false || !false && !true);
        btEval('false or not true or not false').should.equal(false || !true || !false);
        btEval('true and not false or true').should.equal(true && !false || true);
        btEval('not false and true').should.equal(true);
    });

    it('can deal with parens', () => {
        btEval('not (true and false)').should.equal(true);
        btEval('(true and false) or (true and true)').should.equal(true);
    });

    it('can be used as an argument to a func, but only in parens', () => {
        btEval('print (true and not false)');
        (() => btEval('print true and not false')).should.throw();
    });
});
