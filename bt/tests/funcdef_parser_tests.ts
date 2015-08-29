/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';

import * as BT from '../lib/back_talker';
import {FuncParams} from '../lib/functions';
import {Choice, FuncDefCollection, Seq, SimpleFuncDefPart, parse as parseFD} from '../lib/funcdefs';


describe('a funcdef collection', () => {
  it('can be forked by choices', () => {
    var funcs = new FuncDefCollection();

    funcs = funcs.fork(new Choice("<foo|bar>:foobar"));
    funcs.defs.should.have.length(2);

    funcs = funcs.fork(new Choice("<foo|baz>:foobaz"));
    funcs.defs.should.have.length(4);

    funcs = funcs.fork(new Choice("<foo bar|baz>:foobarz"));
    funcs.defs.should.have.length(8);
    funcs.defs.map(def => def.tokens.join(" ")).should.containDeep(["foo foo foo bar"]);
  });

  it('can be concatenated with new pieces', () => {
    var funcs = new FuncDefCollection();

    funcs = funcs.concat(SimpleFuncDefPart.makeBare("foo"));
    funcs.defs.should.have.length(1);

    funcs = funcs.concat(SimpleFuncDefPart.makeBare("bar"));
    funcs.defs.should.have.length(1);

    funcs.defs[0].tokens.join("").should.equal("foobar");
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
                .with.property('tokens')
                  .with.property('0', 'foo');
        });

        it('can recognized named vars like $:foo', function() {
            var result = parseFD('$:foo');
            result.should.be.an.instanceOf(Seq);

            result.should.have.property('pieces')
            result.pieces.should.have.lengthOf(1)

            result.pieces[0]
              .should.be.an.instanceOf(SimpleFuncDefPart)
                .with.property('tokens')
                  .with.property('0', '$');

            result.pieces[0].should.have.property('param');
            var param = result.pieces[0].param;
            param.should.have.property('fromVar', true);
            param.should.have.property('name', 'foo');
        });

        it('can recognize choices like <foo|bar>', function() {
            var result = parseFD('<foo|bar>');
            result.should.be.an.instanceOf(Seq);

            result.pieces.should.have.lengthOf(1);
            result.pieces[0].should.be.an.instanceOf(Choice);

            (<Choice>result.pieces[0]).options[0][0].tokens[0].should.equal('foo');
            (<Choice>result.pieces[0]).options[1][0].tokens[0].should.equal('bar');
        });

        it('can split up choices like <foo|bar>', function() {
          var result = new Choice('<foo|bar>');
          result.options.should.have.lengthOf(2);

          result.options[0][0].tokens[0].should.equal('foo');
          result.options[1][0].tokens[0].should.equal('bar');
        });

        it('can split up choices with empty parts like <|bar>', function() {
          var result = new Choice('<|bar>');
          result.options.should.have.lengthOf(2);
          result.options[0].should.have.length(1);
          result.options[1][0].tokens[0].should.equal('bar');
        });

        it('can split up choices that include vars like <foo|bar $:baz>', () => {
          var result = new Choice('<foo|bar $:baz>');
          result.options.should.have.length(2);

          result.options[0][0].tokens[0].should.equal('foo');
          result.options[1][0].tokens[0].should.equal('bar');
          result.options[1][1].tokens[0].should.equal('$');
        });
    });

    it('can contain a single bareword', function() {
        var result = FuncDefCollection.fromString('wow');
        result.defs.should.have.lengthOf(1);
        result.defs[0].tokens.should.have.lengthOf(1);
        result.defs[0].tokens[0].should.equal('wow');
        result.defs[0].isEmpty().should.not.be.ok;
    });

    it('can contain two barewords', function() {
        var result = FuncDefCollection.fromString('oh no');
        result.defs.length.should.equal(1);

        result.defs[0].isEmpty().should.not.be.ok;

        result.defs[0].tokens.length.should.equal(2);
        result.defs[0].tokens[0].should.equal('oh');
        result.defs[0].tokens[1].should.equal('no');
    });

    it('can contain variables', function() {
        var result = FuncDefCollection.fromString('$!');
        result.defs.length.should.equal(1);

        result.defs[0].isEmpty().should.not.be.ok;

        result.defs[0].tokens.length.should.equal(1);
        result.defs[0].tokens[0].should.equal('$');

        result.defs[0].vivify.length.should.equal(1);
        result.defs[0].vivify[0].should.equal(BT.Vivify.AUTO);
    });

    it('can name variables', function() {
        var result = FuncDefCollection.fromString('$!:cool');
        result.defs.length.should.equal(1);

        var def = result.defs[0];
        def.isEmpty().should.not.be.ok;

        def.tokens.length.should.equal(1);
        def.tokens[0].should.equal('$');

        def.vivify.length.should.equal(1);
        def.vivify[0].should.equal(BT.Vivify.AUTO);

        def.params.length.should.equal(1);
        def.params[0].name.should.equal("cool");
        def.params[0].fromVar.should.be.ok;
    });

    it('can contain simple choices like <foo|bar>', function() {
        var result = FuncDefCollection.fromString('<foo|bar>');
        result.defs.length.should.equal(2);

        result.defs[0].isEmpty().should.not.be.ok;
        result.defs[0].tokens.length.should.equal(1);
        result.defs[0].tokens[0].should.equal('foo');

        result.defs[1].isEmpty().should.not.be.ok;
        result.defs[1].tokens.length.should.equal(1);
        result.defs[1].tokens[0].should.equal('bar');
    });

    it('can have multiple named choices like <foo|bar>:foobar <foo|baz>:foobaz', function() {
        var parsed = parseFD('<foo|bar>:foobar <foo|baz>:foobaz');
        parsed.pieces.should.be.have.property('length', 2);

        parsed.pieces[0].should.be.an.instanceOf(Choice);
        var foobar = <Choice>(parsed.pieces[0]);
        foobar.param.name.should.equal('foobar');
        foobar.options.should.have.length(2);
        foobar.options[0][0].tokens[0].should.equal('foo');
        foobar.options[0].should.have.length(1);
        foobar.options[1][0].tokens[0].should.equal('bar');
        foobar.options[1].should.have.length(1);

        parsed.pieces[1].should.be.an.instanceOf(Choice);
        var foobaz = <Choice>(parsed.pieces[1]);
        foobaz.param.name.should.equal('foobaz');
        foobaz.options.should.have.length(2);
        foobaz.options[0][0].tokens[0].should.equal('foo');
        foobaz.options[0].should.have.length(1);
        foobaz.options[1][0].tokens[0].should.equal('baz');
        foobaz.options[1].should.have.length(1);

        var result = FuncDefCollection.fromString('<foo|bar>:foobar <foo|baz>:foobaz');
        result.defs.length.should.equal(4);

        result.defs.map(def => def.tokens.join(" "))
          .should.containDeep(["foo foo", "bar foo", "foo baz", "bar baz"]);

        var param = result.defs[0].params[0];
        param.should.have.property('name', 'foobar');
        param.should.have.property('value', 0);

        param = result.defs[0].params[1];
        param.should.have.property('name', 'foobaz');
        param.should.have.property('value', 0);
    });

    it('can name choices like <foo|bar>:foobar', function() {
        var result = FuncDefCollection.fromString('<foo|bar>:foobar');
        result.defs.length.should.equal(2);

        result.defs[0].isEmpty().should.not.be.ok;
        result.defs[0].tokens.length.should.equal(1);
        result.defs[0].tokens[0].should.equal('foo');

        result.defs[0].params.length.should.equal(1);
        var param = result.defs[0].params[0];
        param.should.have.property('name', 'foobar');
        param.should.have.property('value', 0);

        result.defs[1].isEmpty().should.not.be.ok;
        result.defs[1].tokens.length.should.equal(1);
        result.defs[1].tokens[0].should.equal('bar');

        result.defs[0].params.length.should.equal(1);
        param = result.defs[1].params[0];
        param.should.have.property('name', 'foobar');
        param.should.have.property('value', 1);

    });
    it('can contain big choices like <foo faa|bar>', function() {
        var result = FuncDefCollection.fromString('<foo faa|bar>');
        result.defs.length.should.equal(2);

        result.defs[0].isEmpty().should.not.be.ok;
        result.defs[0].tokens.length.should.equal(2);
        result.defs[0].tokens[0].should.equal('foo');
        result.defs[0].tokens[1].should.equal('faa');

        result.defs[1].isEmpty().should.not.be.ok;
        result.defs[1].tokens.length.should.equal(1);
        result.defs[1].tokens[0].should.equal('bar');
    });

    it('can contain $ in choices like <bar|$:barvar>', () => {
        var result = FuncDefCollection.fromString("foo <bar|$:barvar>");
        result.defs.length.should.equal(2);

        result.defs[0].tokens[0].should.equal('foo');
        result.defs[0].tokens[1].should.equal('bar');

        result.defs[1].isEmpty().should.not.be.ok;
        result.defs[1].tokens.length.should.equal(2);
        result.defs[1].tokens[0].should.equal('foo');
        result.defs[1].tokens[1].should.equal('$');
        result.defs[1].params.should.have.length(1);

        // foo bar
        var params = new FuncParams(["barvalue"], result.defs[0].params);
        params.has("barvar").should.not.be.ok;

        // foo $:barvar
        params = new FuncParams(["barvalue"], result.defs[1].params);
        params.has("barvar").should.be.ok;
        params.named["barvar"].should.equal("barvalue");
    });
});
