/// <reference path="../typings/tsd.d.ts" />

import should = require('should');
import sinon = require('sinon')

import BT = require('../lib/back_talker');
import {Choice, FuncDefCollection, Seq, SimpleFuncDefPart, parse as parseFD} from '../lib/functions';


describe('a funcdef collection', () => {
  it('can be forked by choices', () => {
    var funcs = new FuncDefCollection();

    funcs = funcs.fork(new Choice("<foo|bar>:foobar"));
    funcs.defs.should.have.length(2);

    funcs = funcs.fork(new Choice("<foo|baz>:foobaz"));
    funcs.defs.should.have.length(4);

    funcs = funcs.fork(new Choice("<foo bar|baz>:foobarz"));
    funcs.defs.should.have.length(8);
    funcs.defs.map(def => def.bits.join(" ")).should.containDeep(["foo foo foo bar"]);
  });

  it('can be concatenated with new pieces', () => {
    var funcs = new FuncDefCollection();

    funcs = funcs.concat(SimpleFuncDefPart.makeBare("foo"));
    funcs.defs.should.have.length(1);

    funcs = funcs.concat(SimpleFuncDefPart.makeBare("bar"));
    funcs.defs.should.have.length(1);

    funcs.defs[0].bits.join("").should.equal("foobar");
  });
});

describe('a funcdef', function() {
    describe('is parsed by a system that', function() {
        it('can recognize barewords like foo', function() {
            var result = parseFD('foo');
            result.should.be.an.instanceOf(Seq);

            result.should.have.property('pieces')
            result.pieces.should.have.lengthOf(1)

            result.pieces[0]
              .should.be.an.instanceOf(SimpleFuncDefPart)
                .with.property('bits')
                  .with.property('0', 'foo');
        });

        it('can recognized named vars like $:foo', function() {
            var result = parseFD('$:foo');
            result.should.be.an.instanceOf(Seq);

            result.should.have.property('pieces')
            result.pieces.should.have.lengthOf(1)

            result.pieces[0]
              .should.be.an.instanceOf(SimpleFuncDefPart)
                .with.property('bits')
                  .with.property('0', '$');

            result.pieces[0].should.have.property('arg');
            var arg = result.pieces[0].arg;
            arg.should.have.property('fromVar', true);
            arg.should.have.property('name', 'foo');
        });

        it('can recognize choices like <foo|bar>', function() {
            var result = parseFD('<foo|bar>');
            result.should.be.an.instanceOf(Seq);

            result.pieces.should.have.lengthOf(1);
            result.pieces[0].should.be.an.instanceOf(Choice);

            (<Choice>result.pieces[0]).options[0][0].bits[0].should.equal('foo');
            (<Choice>result.pieces[0]).options[1][0].bits[0].should.equal('bar');
        });

        it('can split up choices like <foo|bar>', function() {
          var result = new Choice('<foo|bar>');
          result.options.should.have.lengthOf(2);

          result.options[0][0].bits[0].should.equal('foo');
          result.options[1][0].bits[0].should.equal('bar');
        });
    });

    it('can contain a single bareword', function() {
        var result = FuncDefCollection.fromString('wow');
        result.defs.should.have.lengthOf(1);
        result.defs[0].should.have.property('bits');
        result.defs[0].bits.should.have.lengthOf(1);
        result.defs[0].bits[0].should.equal('wow');
        result.defs[0].isEmpty().should.not.be.ok;
    });

    it('can contain two barewords', function() {
        var result = FuncDefCollection.fromString('oh no');
        result.defs.length.should.equal(1);

        result.defs[0].isEmpty().should.not.be.ok;

        result.defs[0].bits.length.should.equal(2);
        result.defs[0].bits[0].should.equal('oh');
        result.defs[0].bits[1].should.equal('no');
    });

    it('can contain variables', function() {
        var result = FuncDefCollection.fromString('$!');
        result.defs.length.should.equal(1);

        result.defs[0].isEmpty().should.not.be.ok;

        result.defs[0].bits.length.should.equal(1);
        result.defs[0].bits[0].should.equal('$');

        result.defs[0].vivify.length.should.equal(1);
        result.defs[0].vivify[0].should.equal(BT.Vivify.AUTO);
    });

    it('can name variables', function() {
        var result = FuncDefCollection.fromString('$!:cool');
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
        var result = FuncDefCollection.fromString('<foo|bar>');
        result.defs.length.should.equal(2);

        result.defs[0].isEmpty().should.not.be.ok;
        result.defs[0].bits.length.should.equal(1);
        result.defs[0].bits[0].should.equal('foo');

        result.defs[1].isEmpty().should.not.be.ok;
        result.defs[1].bits.length.should.equal(1);
        result.defs[1].bits[0].should.equal('bar');
    });

    it('can have multiple named choices like <foo|bar>:foobar <foo|baz>:foobaz', function() {
        var parsed = parseFD('<foo|bar>:foobar <foo|baz>:foobaz');
        parsed.pieces.should.be.have.property('length', 2);

        parsed.pieces[0].should.be.an.instanceOf(Choice);
        var foobar = <Choice>(parsed.pieces[0]);
        foobar.arg.name.should.equal('foobar');
        foobar.options.should.have.length(2);
        foobar.options[0][0].bits[0].should.equal('foo');
        foobar.options[0].should.have.length(1);
        foobar.options[1][0].bits[0].should.equal('bar');
        foobar.options[1].should.have.length(1);

        parsed.pieces[1].should.be.an.instanceOf(Choice);
        var foobaz = <Choice>(parsed.pieces[1]);
        foobaz.arg.name.should.equal('foobaz');
        foobaz.options.should.have.length(2);
        foobaz.options[0][0].bits[0].should.equal('foo');
        foobaz.options[0].should.have.length(1);
        foobaz.options[1][0].bits[0].should.equal('baz');
        foobaz.options[1].should.have.length(1);

        var result = FuncDefCollection.fromString('<foo|bar>:foobar <foo|baz>:foobaz');
        result.defs.length.should.equal(4);

        result.defs.map(def => def.bits.join(" "))
          .should.containDeep(["foo foo", "bar foo", "foo baz", "bar baz"]);

        var arg = result.defs[0].args[0];
        arg.should.have.property('name', 'foobar');
        arg.should.have.property('value', 0);

        arg = result.defs[0].args[1];
        arg.should.have.property('name', 'foobaz');
        arg.should.have.property('value', 0);
    });

    it('can name choices like <foo|bar>:foobar', function() {
        var result = FuncDefCollection.fromString('<foo|bar>:foobar');
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
        var result = FuncDefCollection.fromString('<foo faa|bar>');
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
