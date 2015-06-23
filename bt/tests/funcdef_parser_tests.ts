/// <reference path="../typings/tsd.d.ts" />

import should = require('should');
import sinon = require('sinon')

import BT = require('../lib/back_talker');
import FuncDefParser = require('../lib/functions');


describe('a funcdef', function() {
    describe('is parsed by a system that', function() {
        it('can recognize barewords like foo', function() {
            var result = FuncDefParser.parse('foo');
            result.should.be.an.instanceOf(FuncDefParser.Seq);

            result.should.have.property('pieces')
            result.pieces.should.have.lengthOf(1)

            result.pieces[0]
              .should.be.an.instanceOf(FuncDefParser.SimpleFuncDefPart)
                .with.property('bits')
                  .with.property('0', 'foo');
        });

        it('can recognized named vars like $:foo', function() {
            var result = FuncDefParser.parse('$:foo');
            result.should.be.an.instanceOf(FuncDefParser.Seq);

            result.should.have.property('pieces')
            result.pieces.should.have.lengthOf(1)

            result.pieces[0]
              .should.be.an.instanceOf(FuncDefParser.SimpleFuncDefPart)
                .with.property('bits')
                  .with.property('0', '$');

            result.pieces[0].should.have.property('arg');
            var arg = result.pieces[0].arg;
            arg.should.have.property('fromVar', true);
            arg.should.have.property('name', 'foo');
        });

        it('can recognize choices like <foo|bar>', function() {
            var result = FuncDefParser.parse('<foo|bar>');
            result.should.be.an.instanceOf(FuncDefParser.Seq);

            result.pieces.should.have.lengthOf(1);
            result.pieces[0].should.be.an.instanceOf(FuncDefParser.Choice);

            (<FuncDefParser.Choice>result.pieces[0]).options[0][0].bits[0].should.equal('foo');
            (<FuncDefParser.Choice>result.pieces[0]).options[1][0].bits[0].should.equal('bar');
        });

        it('can split up choices like <foo|bar>', function() {
          var result = new FuncDefParser.Choice('<foo|bar>');
          result.options.should.have.lengthOf(2);

          result.options[0][0].bits[0].should.equal('foo');
          result.options[1][0].bits[0].should.equal('bar');
        });
    });

    it('can contain a single bareword', function() {
        var result = FuncDefParser.FuncDefCollection.fromString('wow');
        result.defs.should.have.lengthOf(1);
        result.defs[0].should.have.property('bits');
        result.defs[0].bits.should.have.lengthOf(1);
        result.defs[0].bits[0].should.equal('wow');
        result.defs[0].isEmpty().should.not.be.ok;
    });

    it('can contain two barewords', function() {
        var result = FuncDefParser.FuncDefCollection.fromString('oh no');
        result.defs.length.should.equal(1);

        result.defs[0].isEmpty().should.not.be.ok;

        result.defs[0].bits.length.should.equal(2);
        result.defs[0].bits[0].should.equal('oh');
        result.defs[0].bits[1].should.equal('no');
    });

    it('can contain variables', function() {
        var result = FuncDefParser.FuncDefCollection.fromString('$!');
        result.defs.length.should.equal(1);

        result.defs[0].isEmpty().should.not.be.ok;

        result.defs[0].bits.length.should.equal(1);
        result.defs[0].bits[0].should.equal('$');

        result.defs[0].vivify.length.should.equal(1);
        result.defs[0].vivify[0].should.equal(BT.Vivify.AUTO);
    });

    it('can name variables', function() {
        var result = FuncDefParser.FuncDefCollection.fromString('$!:cool');
        result.defs.length.should.equal(1);

        var def = result.defs[0];
        def.isEmpty().should.not.be.ok;

        def.bits.length.should.equal(1);
        def.bits[0].should.equal('$');

        def.vivify.length.should.equal(1);
        def.vivify[0].should.equal(BT.Vivify.AUTO);

        def.args.length.should.equal(1);
        def.args[0].name.should.equal("cool");
        def.args[0].fromVar.should.be.ok;
    });

    it('can contain simple choices like <foo|bar>', function() {
        var result = FuncDefParser.FuncDefCollection.fromString('<foo|bar>');
        result.defs.length.should.equal(2);

        result.defs[0].isEmpty().should.not.be.ok;
        result.defs[0].bits.length.should.equal(1);
        result.defs[0].bits[0].should.equal('foo');

        result.defs[1].isEmpty().should.not.be.ok;
        result.defs[1].bits.length.should.equal(1);
        result.defs[1].bits[0].should.equal('bar');
    });

    it('can name choices like <foo|bar>:foobar', function() {
        var result = FuncDefParser.FuncDefCollection.fromString('<foo|bar>:foobar');
        result.defs.length.should.equal(2);

        result.defs[0].isEmpty().should.not.be.ok;
        result.defs[0].bits.length.should.equal(1);
        result.defs[0].bits[0].should.equal('foo');

        result.defs[0].args.length.should.equal(1);
        var arg = result.defs[0].args[0];
        arg.should.have.property('name', 'foobar');
        arg.should.have.property('value', 0);

        result.defs[1].isEmpty().should.not.be.ok;
        result.defs[1].bits.length.should.equal(1);
        result.defs[1].bits[0].should.equal('bar');

        result.defs[0].args.length.should.equal(1);
        arg = result.defs[1].args[0];
        arg.should.have.property('name', 'foobar');
        arg.should.have.property('value', 1);

    });
    it('can contain big choices like <foo faa|bar>', function() {
        var result = FuncDefParser.FuncDefCollection.fromString('<foo faa|bar>');
        result.defs.length.should.equal(2);

        result.defs[0].isEmpty().should.not.be.ok;
        result.defs[0].bits.length.should.equal(2);
        result.defs[0].bits[0].should.equal('foo');
        result.defs[0].bits[1].should.equal('faa');

        result.defs[1].isEmpty().should.not.be.ok;
        result.defs[1].bits.length.should.equal(1);
        result.defs[1].bits[0].should.equal('bar');
    });
});
