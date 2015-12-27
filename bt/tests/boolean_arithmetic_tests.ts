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
        btEval('true | true').should.equal(true);
        btEval('true | false').should.equal(true);
        btEval('false | true').should.equal(true);
        btEval('false | false').should.equal(false);
        btEval('false | false | true').should.equal(true);
    });

    it('can do ands', () => {
        btEval('true & true').should.equal(true);
        btEval('true & false').should.equal(false);
        btEval('false & true').should.equal(false);
        btEval('false & false').should.equal(false);
        btEval('false & false & true').should.equal(false);
        btEval('true & true & true').should.equal(true);
    });

    it('can do negation', () => {
        btEval('! true').should.equal(false);
    });

    it('can do negation with ands/ors', () => {
        btEval('true &! false').should.equal(true);
        btEval('false |! false &! true').should.equal(false || !false && !true);
        btEval('false |! true |! false').should.equal(false || !true || !false);
        btEval('true &! false | true').should.equal(true && !false || true);
        btEval('! false & true').should.equal(true);
    });

    it('can deal with parens', () => {
        btEval('! (true & false)').should.equal(true);
        btEval('(true & false) | (true & true)').should.equal(true);
    });

    it('can be used as an argument to a command, but only in parens', () => {
        btEval('print (true &! false)');
        (() => btEval('print true &! false')).should.throw();
    });
});
