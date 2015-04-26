var FuncDefParser = require('../functions')
    ,should = require('should')
    ,sinon = require('sinon')
;


describe('the funcdef parser', function() {
    it('can correctly deal with a single bareword', function() {
        var result = FuncDefParser.FuncDefCollection.fromString('wow');
        result.defs.length.should.equal(1);

        result.defs[0].isEmpty().should.not.be.ok;

        result.defs[0].bits.length.should.equal(1);
        result.defs[0].bits[0].should.equal('wow');
    });
});
