/// <reference path="../typings/tsd.d.ts" />
import * as sinon from 'sinon';
import 'should';

import {CommandParams} from "../lib/commands";
import {Evaluator} from "../lib/evaluator";
import {Scope} from "../lib/scope";


export function soon<T>(v: T): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(v);
        }, 100);
    });
}

function ident(a: CommandParams) {
    return a;
}


function identAsync(a: CommandParams) {
    return Promise.resolve(a);
}


export function addSpyToScope(scope: Scope, hook: Function = ident) {
    var spyFunc = sinon.spy((a: CommandParams, self: Evaluator) => {
        if (a.body) {
            return self.makeSub().eval(a.body);
        } else {
            return hook.call(self, a, self);
        }
    });

    let pattern = ["spy <|on $:a|on $:a $:b|on $:a $:b $:c|on $:a $:b $:c $:d> <|:>"];
    scope.addCommand(pattern, spyFunc);

    return spyFunc;
}


export function addAsyncSpyToScope(scope: Scope, hook: Function = identAsync) {
    var spyFunc = sinon.spy((a: CommandParams, self: Evaluator) => {
        return new Promise((resolve, reject) => {
            if (a.body) {
                setTimeout(() => resolve(self.makeSub().eval(a.body)), 0);
            } else {
                setTimeout(() => resolve(hook.call(self, a, self)), 0);
            }
        });
    });

    let pattern = ["spy async <|on $:a|on $:a $:b|on $:a $:b $:c|on $:a $:b $:c $:d> <|:>"];
    scope.addCommand(pattern, spyFunc);

    return spyFunc;
}
