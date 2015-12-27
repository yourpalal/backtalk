/// <reference path="../typings/tsd.d.ts" />
import {Immediate} from '../lib/commands';


describe('the Immediate class', () => {
    it("can be resolved within the same execution context", () => {
        let result = new Immediate((resolve) => resolve(3)).then((val) => val);
        result.should.equal(3);
    });

    it("catches errors that happen in its call stack", (done) => {
        let result = new Immediate(() => {throw new Error("ouch");});

        result.catch((err) => {
            err.should.eql(new Error("ouch"));
            done();
        });
    });

    describe("Immediate#catch", () => {
        it("rethrows errors by default", () => {
            (() => {
                new Immediate(() => { throw new Error("oops"); }).catch();
            }).should.throwError("oops");
        });

        it("returns values", () => {
            new Immediate(() => { throw new Error("oops"); }).catch(() => 3).should.eql(3);
            Immediate.resolve(3).catch().should.eql(3);
        });
    });

    describe("Immediate#then", () => {
        it("is equivalent to #catch when there is an error", () => {
            (() => {
                new Immediate(() => { throw new Error("oops"); }).then();
            }).should.throwError("oops");

            new Immediate(() => { throw new Error("oops"); }).then(undefined, () => 3).should.eql(3);
        });

        it("returns the value if called with no arguments", () => {
            Immediate.resolve(3).then().should.eql(3);
        });

        it("returns the result of the fulfilled handler if there is no error", () => {
            Immediate.resolve(3).then((x) => {
                x.should.eql(3);
                return 4;
            }).should.eql(4);
        });

        it("returns the result of the rejected handler if there is an error", () => {
            Immediate.reject("error").then(undefined, (err) => {
                err.should.eql("error");
                return "rejected";
            }).should.eql("rejected");
        });
    });

    describe("Immediate.resolve", () => {
        it("preserves Promise instances", () => {
            let promise = new Promise((r) => {
            });

            Immediate.resolve(promise).should.equal(promise);
        });

        it("wraps immediately usable values in an Immediate", () => {
            Immediate.resolve(3).then((val) => val).should.equal(3);
        });
    });
});
