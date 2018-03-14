/* eslint-env mocha */
var assert = require('assert');

var helpers = require("../helpers");

describe("helpers", function() {
  describe("pathMatch", function() {
    var pathMatch = helpers.pathMatch;
    it("should match exact path", function() {
      assert.ok(pathMatch("/path", "/path"));
    });
    it("should match path with querystring", function() {
      assert.ok(pathMatch("/path?abc=123", "/path"));
    });
    it("should not match different path", function() {
      assert.equal(pathMatch("/another", "/path"), false);
    });
    it("should not match path with other stuff on the end", function() {
      assert.equal(pathMatch("/path-and", "/path"), false);
    });
  });

  describe("createMemoizedToJson", function() {
    var stats = function() {
      return {
        toJson: function() {
          return {};
        }
      }
    };
    var toJson = null;
    beforeEach(function() {
      toJson = helpers.createMemoizedToJson();
    });
    it("should return same value for same stats instance", function() {
      var instance = stats();
      assert.strictEqual(toJson(instance), toJson(instance));
    });
    it("should return same value for same stats instance", function() {
      assert.notStrictEqual(toJson(stats()), toJson(stats()));
    });
  });
});
