var parser = new (require('../ast').Parser)()
    ,should = require('should')
;


var bt_eval = function(s) { return parser.fromSource(s).Eval(); };

describe('When doing math', function() {
    it('can understand integer literals', function() {
        bt_eval('5').should.equal(5);
        bt_eval('0').should.equal(0);
        bt_eval('1').should.equal(1);
    });

    it('can understand floating point literals', function() {
        bt_eval('1.23').should.equal(1.23);
        bt_eval('0.23').should.equal(0.23);
        bt_eval('90000.00').should.equal(90000.00);
    });

    it('can do addition', function() {
        bt_eval('1.23+2').should.equal(3.23);
        bt_eval('1.23+90').should.equal(91.23);
        bt_eval('20+400').should.equal(420);
    });

    it('can do subtraction', function() {
        bt_eval('1.23-2').should.equal(-0.77);
        bt_eval('1.23-90').should.equal(-88.77);
        bt_eval('20-400').should.equal(-380);
    });

    it('can do multiplication', function() {
        bt_eval('1.23*2').should.equal(1.23 * 2);
        bt_eval('1.23*90').should.equal(1.23 * 90);
        bt_eval('20*400').should.equal(20 * 400);
    });

    it('can do associative additions', function() {
        bt_eval('1+2+3').should.equal(6);

        bt_eval('1+2-3').should.equal(0);
        bt_eval('1+2-3+72').should.equal(72);
    });

    it('can deal with parens', function() {
        bt_eval('(3+4)').should.equal(7);
    });

    it('can do mixed operations', function() {
        bt_eval('1.23*2-10').should.equal(1.23*2-10);
        bt_eval('1.23-2*10').should.equal(1.23-2*10);
        bt_eval('1.23-2*10').should.equal(1.23-2*10);
        bt_eval('2-8*3+4').should.equal(2-8*3+4);
        bt_eval('10/2-8*3+4/7-6').should.equal(10/2-8*3+4/7-6);
        bt_eval('10/(3*2-8)*3+4/7-6').should.equal(10/(3*2-8)*3+4/7-6);
    });
});
