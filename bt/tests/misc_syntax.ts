/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';

import * as BT from '../lib/back_talker';

describe('BackTalker code', () => {
    it('can have one expression per line', () => {
        BT.eval("3 + 4\n5+ 4");
    });

    it('can have newlines before expressions', () => {
        BT.eval("\n 3 + 4");
    });

    it('can have string literals', () => {
        BT.eval('"neat"').get().should.equal('neat');
    });
});
