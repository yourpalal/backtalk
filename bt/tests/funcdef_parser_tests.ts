/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./custom_assertions.d.ts" />

import 'should';

import * as BT from '../lib/index';
import {IllegalFuncdefError} from '../lib/funcdefs';
import {FuncParams} from '../lib/functions';
import {Choice, FuncDefCollection, Seq, SimpleFuncDefPart, parse as parseFD} from '../lib/funcdefs';


describe('a funcdef collection', () => {
    it('can be forked by choices', () => {
        var funcs = new FuncDefCollection();

        funcs = funcs.fork(new Choice("<foo|bar>:foobar"));
        funcs.should.haveSignatures('foo', 'bar');

        funcs = funcs.fork(new Choice("<foo|baz>:foobaz"));
        funcs.should.haveSignatures('foo foo', 'bar foo', 'foo baz', 'bar baz');

        funcs = funcs.fork(new Choice("<foo bar|baz>:foobarz"));
        funcs.should.haveSignatures(
            'foo foo foo bar',
            'bar foo foo bar',
            'foo baz foo bar',
            'bar baz foo bar',

            'foo foo baz',
            'bar foo baz',
            'foo baz baz',
            'bar baz baz');
    });

    it('can be concatenated with new pieces', () => {
        var funcs = new FuncDefCollection();

        funcs = funcs.concat(SimpleFuncDefPart.makeBare("foo"));
        funcs.defs.should.have.length(1);

        funcs = funcs.concat(SimpleFuncDefPart.makeBare("bar"));
        funcs.defs.should.have.length(1);

        funcs.defs[0].should.haveSignature("foo bar");
    });
});

describe('a funcdef', () => {
    describe('is parsed by a system that', () => {
        it('can recognize barewords like foo', () => {
            var result = parseFD('foo');
            result.should.be.an.instanceOf(Seq);

            result.should.have.property('pieces');
            result.pieces.should.have.lengthOf(1);

            result.pieces[0]
                .should.be.an.instanceOf(SimpleFuncDefPart)
                .with.property('token', 'foo');
        });

        it('can recognized named vars like $:foo', () => {
            var result = parseFD('$:foo');
            result.should.be.an.instanceOf(Seq);

            result.should.have.property('pieces');
            result.pieces.should.have.lengthOf(1);

            result.pieces[0]
                .should.be.an.instanceOf(SimpleFuncDefPart)
                .with.property('token', '$');

            result.pieces[0].param.should.beVarParam('foo');
        });

        it('can recognize choices like <foo|bar>', () => {
            var result = parseFD('<foo|bar>');
            result.should.be.an.instanceOf(Seq);

            result.pieces.should.have.lengthOf(1);
            result.pieces[0].should.be.choiceOf(null, ['foo'], ['bar']);
        });

        it('can split up choices like <foo|bar>', () => {
            new Choice('<foo|bar>').should.be.choiceOf(null, ['foo'], ['bar']);
        });

        it('can split up choices with empty parts like <|bar>', () => {
            var result = new Choice('<|bar>');
            result.should.be.choiceOf(null, [], ['bar']);
        });

        it('can split up choices with empty parts and colons like <|:>', () => {
            new Choice('<|:>').should.be.choiceOf(null, [], [':']);
        });

        it('can split up choices that include vars like <foo|bar $:baz>', () => {
            var result = new Choice('<foo|bar $:baz>');
            result.should.be.choiceOf(null, ['foo'], ['bar', '$']);
        });
    });

    it('can contain a single bareword', () => {
        var result = FuncDefCollection.fromString('wow');
        result.defs.should.have.lengthOf(1);
        result.defs[0].should.haveSignature('wow');
    });

    it('can contain two barewords', () => {
        var result = FuncDefCollection.fromString('oh no');

        result.defs.should.have.length(1);
        result.defs[0].should.haveSignature('oh no');
    });

    it('can contain variables', () => {
        var result = FuncDefCollection.fromString('$!');
        result.defs.should.have.length(1);

        result.defs[0].should.haveSignature('$');
        result.defs[0].vivify.should.eql([BT.Vivify.AUTO]);
    });

    it('can name variables', () => {
        var result = FuncDefCollection.fromString('$!:cool');
        result.defs.should.have.length(1);

        var def = result.defs[0];
        def.should.haveSignature('$');
        def.vivify.should.eql([BT.Vivify.AUTO]);
        def.should.haveVarParam(0, "cool");
    });

    it('can contain simple choices like <foo|bar>', () => {
        FuncDefCollection.fromString('<foo|bar>').should
            .haveSignatures('foo', 'bar');
    });

    it('cannot contain nested choices like <foo|<baz|bar>>', () => {
        (() => FuncDefCollection.fromString('<foo|<baz|bar>>')).should.throw(IllegalFuncdefError);
    });

    it('throws an error on bad funcdefs', () => {
        (() => FuncDefCollection.fromString(': WOW')).should.throw(IllegalFuncdefError);
    });

    it('can have multiple named choices like <foo|bar>:foobar <foo|baz>:foobaz', () => {
        var parsed = parseFD('<foo|bar>:foobar <foo|baz>:foobaz');
        parsed.pieces.should.be.have.property('length', 2);

        parsed.pieces[0].should.be.choiceOf('foobar',
            ['foo'],
            ['bar']
            );

        parsed.pieces[1].should.be.an.instanceOf(Choice);
        var foobaz = <Choice>(parsed.pieces[1]);
        foobaz.should.be.choiceOf('foobaz',
            ['foo'],
            ['baz']
            );

        var result = FuncDefCollection.fromString('<foo|bar>:foobar <foo|baz>:foobaz');
        result.should.haveSignatures('foo foo', 'bar foo', 'foo baz', 'bar baz');
        result.defs[0].should.haveChoiceParam(0, 'foobar', 0);
        result.defs[0].should.haveChoiceParam(1, 'foobaz', 0);
    });

    it('can name choices like <foo|bar>:foobar', () => {
        var result = FuncDefCollection.fromString('<foo|bar>:foobar');
        result.should.haveSignatures('foo', 'bar');

        result.defs[0].params.should.have.length(1);
        result.defs[0].should.haveChoiceParam(0, 'foobar', 0);
        result.defs[1].should.haveChoiceParam(0, 'foobar', 1);
    });

    it('can contain big choices like <foo faa|bar>', () => {
        var result = FuncDefCollection.fromString('<foo faa|bar>');
        result.should.haveSignatures("foo faa", "bar");
    });

    it('can contain $ in choices like <bar|$:barvar>', () => {
        var result = FuncDefCollection.fromString("foo <bar|$:barvar>");
        result.should.haveSignatures('foo bar', 'foo $');
        result.defs[1].should.haveVarParam(0, 'barvar');

        // foo bar
        var params = new FuncParams(["barvalue"], result.defs[0].params);
        params.has('barvar').should.not.be.ok;

        // foo $:barvar
        params = new FuncParams(["barvalue"], result.defs[1].params);
        params.should.have.namedParam('barvar', "barvalue");
    });

    it('can finish with a colon to match hanging invocations', () => {
        FuncDefCollection.fromString('foo :').should.haveSignatures('foo :');
    });

    it('can optionally match hanging invocations via <|:>', () => {
        FuncDefCollection.fromString('foo <|:>').should.haveSignatures('foo', 'foo :');
    });
});
