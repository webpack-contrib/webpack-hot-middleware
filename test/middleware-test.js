/* eslint-env mocha */
var events = require('events');
var assert = require('assert');

var sinon = require('sinon');
var supertest = require('supertest');

var express = require('express');
var http = require('http');
var io = require('socket.io-client');
var webpackHotMiddleware = require('../middleware');

var serverPort = process.env.PORT || 3030;

describe("middleware", function() {
  var s, compiler, app, server, middleware, client;

  context("with default options", function() {
    beforeEach(startServer({log: function() {}}));
    beforeEach(connectClient({}));
    afterEach(disconnectClient);
    afterEach(stopServer);

    it("should notify clients when bundle rebuild begins", function(done) {
      client.on("message", function(event) {
        assert.equal(event.action, "building");
        done();
      });
      compiler.emit("compile");
    });
    it("should notify clients when bundle is complete", function(done) {
      client.on("message", function(event) {
        assert.equal(event.action, "built");
        done();
      });

      compiler.emit("done", stats({
        time: 100,
        hash: "deadbeeffeddad",
        warnings: false,
        errors: false,
        modules: []
      }));
    });
    it("should notify clients when bundle is complete (multicompiler)", function(done) {
      client.on("message", verify);

      compiler.emit("done", stats({
        children: [
          {
            time: 100,
            hash: "deadbeeffeddad",
            warnings: false,
            errors: false,
            modules: []
          },
          {
            time: 150,
            hash: "gwegawefawefawef",
            warnings: false,
            errors: false,
            modules: []
          }
        ]
      }));

      // Finish test when client received two updates
      verify.n = 0;
      function verify(event) {
        assert.equal(event.action, "built");
        if (++verify.n < 2) return;
        done();
      }
    });
    it("should notify new clients about current compilation state", function(done) {
      compiler.emit("done", stats({
        time: 100,
        hash: "deadbeeffeddad",
        warnings: false,
        errors: false,
        modules: []
      }));
      var client2 = io.connect("http://localhost:" + serverPort + "/__webpack_hmr");
      client2.on("message", function(event) {
        assert.equal(event.action, "sync");
        done();
      });
    });
    it("should have tests on the payload of bundle complete");
    it("should notify all clients", function(done) {
      var client2 = io.connect("http://localhost:" + serverPort + "/__webpack_hmr");

      client.on("message", verify);
      client2.on("message", verify);
      client2.on("connect", function () {
        compiler.emit("compile");
      });

      // Finish test when both clients received data
      verify.n = 0;
      function verify() {
        if (++verify.n < 2) return;
        client2.disconnect();
        done();
      }
    });
    it("should allow custom events to be published", function(done) {
      middleware.publish({ obj: 'with stuff' });

      client.on("message", function(event) {
        assert.deepEqual(event, { obj: 'with stuff' });
        done();
      });
    });
  });

  beforeEach(function() {
    s = sinon.sandbox.create();
    compiler = new (events.EventEmitter)();
    compiler.plugin = compiler.on;
  });
  afterEach(function() {
    s.restore();
  });
  function startServer(opts) {
    return function() {
      app = express();
      server = http.Server(app);
      middleware = webpackHotMiddleware(server, compiler, opts);
      server.listen(serverPort);
    };
  }
  function stopServer() {
    server.close();
  }
  function connectClient(opts) {
    return function(done) {
      var path = opts.path || "/__webpack_hmr";
      client = io.connect("http://localhost:" + serverPort + path);
      client.on("connect", done);
    }
  }
  function disconnectClient() {
    client.disconnect();
  }
  function stats(data) {
    return {
      toJson: function() {
        return data;
      }
    };
  }
});
