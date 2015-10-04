/// <reference path="../typings/tsd.d.ts" />
import * as sinon from 'sinon';
import * as should from 'should';

import {FuncParams, FuncResult} from "../lib/functions";
import {Evaluator} from "../lib/evaluator";
import {Scope} from "../lib/scope";


function ident(a: FuncParams) {
    return a;
}


function identAsync(a: FuncParams) {
    return Promise.resolve(a);
}


export function addSpyToScope(scope: Scope, hook: Function = ident) {
    var spyFunc = sinon.spy((a: FuncParams, self: Evaluator) => {
        if (a.body) {
            return self.makeSub().eval(a.body);
        } else {
            return hook.call(self, a, self);
        }
    });

    let pattern = ["spy <|on $:a|on $:a $:b|on $:a $:b $:c|on $:a $:b $:c $:d> <|:>"];
    scope.addFunc(pattern, spyFunc);

    return spyFunc;
}


export function addAsyncSpyToScope(scope: Scope, hook: Function = identAsync) {
    var spyFunc = sinon.spy((a: FuncParams, self: Evaluator) => {
        return new Promise((resolve, reject) => {
            if (a.body) {
                setTimeout(() => resolve(self.makeSub().eval(a.body)), 0);
            } else {
                setTimeout(() => resolve(hook.call(self, a, self)), 0);
            }
        });
    });

    let pattern = ["spy async <|on $:a|on $:a $:b|on $:a $:b $:c|on $:a $:b $:c $:d> <|:>"];
    scope.addFunc(pattern, spyFunc);

    return spyFunc;
}
