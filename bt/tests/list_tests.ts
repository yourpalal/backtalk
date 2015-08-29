/// <reference path="../typings/tsd.d.ts" />
import * as should from 'should';

import * as BT from '../lib/back_talker';


describe('BackTalker lists', () => {
    var scope;

    beforeEach(() => {
        scope = BT.StdLib.inScope(new BT.Scope());
    });

    it('can be constructed via a block', () => {
      var code = `list of:
          "Miss Lesa"
          "Jerry"
          "Roy"
          "Bubba"
          "Ricky"
          "Victor"`;

      var result = BT.eval(code, scope).get();
      result.should.have.lengthOf(6);
    });

    it('can be assigned to a var via block form of "with as" ', () => {
      var code = `
      with $cast as:
        list of:
          "Miss Lesa"
          "Jerry"
          "Roy"
          "Bubba"
          "Ricky"
          "Victor"`;

      var result = BT.eval(code, scope).get();
      result.should.have.lengthOf(6);

      scope.has("cast").should.be.ok;
      scope.get("cast")[0].should.equal("Miss Lesa");
    });

    it('individual items can be accessed using `item $ of $`', () => {
      var code = `
      with $letters as:
        list of:
          "a"
          "b"
      item 1 of $letters`;
      BT.eval(code, scope).get().should.equal("a");
    });
});
