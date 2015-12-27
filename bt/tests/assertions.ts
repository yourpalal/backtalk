/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';

import {CommandParam, CommandParams} from '../lib/commands';
import {CommandDef, Choice} from '../lib/commanddefs';


should.Assertion.add('haveChoiceParam', function(i: number, name: string, value: number) {
    this.params = {
        operator: 'have the CommandParam',
        expected: name,
        showDiff: false
    };

    this.obj.should.be.an.instanceOf(CommandDef);
    this.obj.params[i].name.should.equal(name);
    this.obj.params[i].fromVar.should.not.be.ok;
    this.obj.params[i].value.should.equal(value);
});


should.Assertion.add('beVarParam', function(name: string) {
    this.params = {
        operator: 'be the CommandParam',
        expected: { name: name, fromVar: true },
        actual: this.obj,
        showDiff: true,
    };

    this.is.an.instanceOf(CommandParam);
    let obj = this.obj;
    obj.should.have.property('name', name);
    obj.should.have.property('fromVar', true);
});

should.Assertion.add('haveVarParam', function(i: number, name: string) {
    this.params = {
        operator: 'have the CommandParam',
        expected: name,
        showDiff: false
    };

    this.obj.should.be.an.instanceOf(CommandDef);
    this.obj.params[i].should.beVarParam(name);
});

should.Assertion.add('haveSignatures', function(...sigs: string[]) {
    let actual = this.obj.defs.map((def) => def.tokens.join(" "));

    this.params = {
        operator: 'have the signatures',
        expected: sigs,
        actual: actual,
        showDiff: true,
    };

    actual.should.eql(sigs);
});

should.Assertion.add('haveSignature', function(sig: string) {
    let actual = this.obj.tokens.join(" ").should.equal(sig);

    this.params = {
        operator: 'have the signature',
        expected: sig,
        actual: actual,
        showDiff: true,
    };
    this.obj.isEmpty().should.not.be.ok;
});

should.Assertion.add('choiceOf', function(name: string, ...options: string[][]) {
    this.instanceOf(Choice);
    if (name === null) {
        this.obj.should.have.property('param', null);
    } else {
        this.obj.param.should.have.property('name', name);
    }

    this.params = {
        operator: 'have the options',
        actual: this.obj.options
    };

    this.obj.options.should.have.length(options.length);
    for (let i = 0; i < options.length; i++) {
        this.obj.options[i].map((p) => p.token).should.eql(options[i]);
    }
});

should.Assertion.add('namedParam', function(name: string, value: any) {
    this.params = {
        operator: 'have the property',
        expected: 'name -> ' + value
    };

    this.be.instanceOf(CommandParams);
    this.obj.named.should.have.property(name, value);
});
