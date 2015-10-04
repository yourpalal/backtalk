/// <reference path="../typings/tsd.d.ts" />

interface ShouldAssertion {
    namedParam(name: string, value: any): ShouldAssertion;
    haveVarParam(i: number, name: string): ShouldAssertion;
    beVarParam(name: string): ShouldAssertion;
    haveChoiceParam(i: number, name: string, value: number): ShouldAssertion;
    haveSignature(...tokens: string[]): ShouldAssertion;
    haveSignatures(...sigs: string[]): ShouldAssertion;
    choiceOf(name: string, ...options: string[][]): ShouldAssertion;
}
