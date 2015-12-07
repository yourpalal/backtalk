/// <reference path="../typings/tsd.d.ts" />
import 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/index';
import {IllegalPropertyError} from '../lib/secure';

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

    it('provides a function for getting array items', () => {
        let bt = new BT.Evaluator();
        bt.scope.set("x", [3,5,1]);
        bt.evalString("item 1 of $x").should.eql(3);
        bt.evalString("item 2 of $x").should.eql(5);
        bt.evalString("item 3 of $x").should.eql(1);
        (bt.evalString("item 4 of $x") === undefined).should.be.ok;
    });

    it('provides a function for getting properties', () => {
        let bt = new BT.Evaluator();
        bt.scope.set("x", {"neat": 1, "cool": 2});
        bt.evalString('property "neat" of $x').should.eql(1);
        bt.evalString('property "cool" of $x').should.eql(2);
        (() => bt.evalString('property "missing" of $x')).should.throw();
    });

    it('secures property access', () => {
        let bt = new BT.Evaluator();
        bt.scope.set("x", {"neat": 1, "cool": 2});
        (() => bt.evalString('property "Function" of $x')).should.throw(IllegalPropertyError);
        (() => bt.evalString('property "eval" of $x')).should.throw(IllegalPropertyError);
        (() => bt.evalString('property "prototype" of $x')).should.throw(IllegalPropertyError);
        (() => bt.evalString('property "constructor" of $x')).should.throw(IllegalPropertyError);
    });
});
