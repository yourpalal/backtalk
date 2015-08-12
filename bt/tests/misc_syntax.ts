/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';

import * as BT from '../lib/back_talker';

describe('BackTalker code', function() {
    it('can have one expression per line', function() {
        BT.eval("3 + 4\n5+ 4");
    });

    it('can have newlines before expressions', function() {
        BT.eval("\n 3 + 4");
    });

    it('can have string literals', function() {
        BT.eval('"neat"').should.equal('neat');
    });
});
