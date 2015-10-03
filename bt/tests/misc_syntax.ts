/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';

import * as BT from '../lib';

describe('BackTalker code', () => {
    it('can have one expression per line', () => {
        BT.eval("3 + 4\n5+ 4");
    });

    it('can have newlines before expressions', () => {
        BT.eval("\n 3 + 4");
    });

    it('can have string literals', () => {
        BT.eval('"neat"').should.equal('neat');
    });

    it('can have spaces before/after the colon in hanging calls', () => {
      let scope = BT.StdLib.inScope(new BT.Scope());
      BT.eval('with $wow as :\n   4', scope);

      scope.get('wow').should.equal(4);
    });
});
