import {FuncArg, FuncParams} from "../lib/functions";
import {BadTypeError} from "../lib/errors";

describe('the BackTalker func params obj', () => {
  var args:FuncParams, spec:FuncArg[];
  before(() => {
    spec = [
      FuncArg.forVar("int"),
      FuncArg.forVar("string"),
      FuncArg.forChoice("choice").withValue(0),
      FuncArg.forChoice("baz").withValue(1)
    ];

    args = new FuncParams([0, "wow"], spec);
  });

  it('can check if arguments exist', () => {
    args.has("int").should.be.ok;
    args.has("nope").should.not.be.ok;
  });

  it('can make sure arguments are correctly typed', () => {
    args.hasNumber("int").should.be.ok;
    args.hasNumber("string").should.not.be.ok;
    args.hasNumber("nope").should.not.be.ok;
    args.getNumber("int").should.equal(0);
    (() => args.getNumber("string")).should.throw(BadTypeError);

    args.hasString("string").should.be.ok;
    args.hasString("int").should.not.be.ok;
    args.hasString("nope").should.not.be.ok;
    args.getString("string").should.equal("wow");
    (() => args.getString("int")).should.throw(BadTypeError);
  });
});
