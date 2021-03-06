/// <reference path="../typings/tsd.d.ts" />
import 'should';
import * as sinon from 'sinon';

import * as BT from '../lib/index';
import * as VM from '../lib/vm';


import {addSpyToScope} from "./util";


class ExpresserSpy implements VM.Expresser {
    public express: { (any): void };
    public finish: { (): void };

    public promise: Promise<any>;

    constructor() {
        this.express = sinon.spy();
        this.promise = new Promise<any>((resolve, reject) => {
            this.finish = sinon.spy(resolve);
        });
    }
}


describe('The BackTalker VM', () => {
    var evaluator: BT.Evaluator, scope: BT.Scope, spyFunc, expressed, vm: VM.VM;

    let execute = (...program: VM.Instructions.Instruction[]) => {
        var expresserSpy = new ExpresserSpy();
        expressed = <any>expresserSpy.express;
        vm = new VM.VM(program, evaluator, expresserSpy);
        vm.resume();
        return expresserSpy.promise;
    };

    beforeEach(() => {
        scope = new BT.Scope();
        evaluator = new BT.Evaluator(scope);
        spyFunc = addSpyToScope(scope);
    });

    it('can do simple math', () => execute(
        new VM.Instructions.Push(3),
        new VM.Instructions.Push(2),
        VM.Instructions.Add,
        VM.Instructions.Express
        ).then(() => {
            expressed.calledOnce.should.be.ok;
            expressed.calledWith(5).should.be.ok;
        }));

    it('can call a command', () => execute(
            new VM.Instructions.Push(3),
            new VM.Instructions.Push(2),
            new VM.Instructions.CallCommand("spy on $ $"),
            VM.Instructions.Express
        ).then(() => {
            expressed.calledOnce.should.be.ok;
            spyFunc.calledOnce.should.be.ok;
            var params = spyFunc.firstCall.args[0];
            params.named.should.have.property("a", 3);
            params.named.should.have.property("b", 2);
        }));
});

describe('The BackTalker Compiler', () => {
    describe('turns ASTs into instructions', () => {
        it('can compile math', () => {
            var result = VM.Compiler.compile(BT.parseOrThrow("3 + 4"));
            result.should.eql([
                new VM.Instructions.Push(3),
                new VM.Instructions.Push(4),
                VM.Instructions.Add,
                VM.Instructions.Express
            ]);

            result = VM.Compiler.compile(BT.parseOrThrow("3 / 4"));
            result.should.eql([
                new VM.Instructions.Push(3),
                new VM.Instructions.Push(4),
                VM.Instructions.Div,
                VM.Instructions.Express
            ]);
        });

        it('can compile command calls', () => {
            var result = VM.Compiler.compile(BT.parseOrThrow("spy on $foo $bar 3"));
            result.should.eql([
                new VM.Instructions.GetVivifiable("foo"),
                new VM.Instructions.GetVivifiable("bar"),
                new VM.Instructions.Push(3),
                new VM.Instructions.CallCommand("spy on $ $ $"),
                VM.Instructions.Express
            ]);

            result = VM.Compiler.compile(BT.parseOrThrow("spy on"));
            result.should.eql([
                new VM.Instructions.CallCommand("spy on"),
                VM.Instructions.Express
            ]);
        });
    });
});
