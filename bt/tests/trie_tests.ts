
/// <reference path="../typings/tsd.d.ts" />

import should = require('should');

import Trie = require('../lib/trie');


describe('the Trie', () => {
    it('can store things', () => {
      var t = new Trie<number>();
      t.put("wow", 5);
      t.get("wow").should.equal(5);

      t.put("yay", 6);
      t.get("yay").should.equal(6);
    });

    it('can iterate over items', () => {
        var t = new Trie<number>(),
            results = {};

        t.put("wow", 5);
        t.put("yay", 6);

        t.each((key, val) => {
          results[key] = val;
        });

        results.should.have.property("wow", 5);
        results.should.have.property("yay", 6);
    });

    it('can iterate over subitems', () => {
        var t = new Trie<number>(),
            results = {};

          t.put("we like this", 1);
          t.put("we think it is cool", 2);
          t.put("we say woah!!!", 3);

          t.getChild("we ").each((key, val) => {
              results[key] = val;
          });

        results.should.have.property("like this", 1);
        results.should.have.property("think it is cool", 2);
        results.should.have.property("say woah!!!", 3);
    });
});
