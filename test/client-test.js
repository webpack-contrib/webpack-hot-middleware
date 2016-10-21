/* eslint-env mocha, browser */

var sinon = require('sinon');
var io = require('socket.io-client');
var events = require('events');

describe("client", function() {
  var s, client, clientOverlay, processUpdate, socketio;

  beforeEach(function() {
    s = sinon.sandbox.create();
  });
  afterEach(function() {
    s.restore();
  });

  context("with default options", function() {
    beforeEach(function setup() {
      global.__resourceQuery = ''; // eslint-disable-line no-underscore-dangle
      global.window = {
        location: {
          protocol: 'http:',
          hostname: 'localhost'
        }
      };
    });
    beforeEach(loadClient);
    it("should connect to __webpack_hmr", function() {
      sinon.assert.calledOnce(io.connect);
      var l = global.window.location;
      var socketServer = l.protocol + "//" + l.hostname + ":3000";
      sinon.assert.calledWith(io.connect, socketServer, { timeout: 20 * 1000 });
    });
    it("should trigger webpack on successful builds", function() {
      var socket = io.connect.lastCall.returnValue;
      socket.emit('message', {
        action: 'built',
        time: 100,
        hash: 'deadbeeffeddad',
        errors: [],
        warnings: [],
        modules: []
      });
      sinon.assert.calledOnce(processUpdate);
    });
    it("should trigger webpack on successful syncs", function() {
      var socket = io.connect.lastCall.returnValue;
      socket.emit('message',{
        action: 'sync',
        time: 100,
        hash: 'deadbeeffeddad',
        errors: [],
        warnings: [],
        modules: []
      });
      sinon.assert.calledOnce(processUpdate);
    });
    it("should call subscribeAll handler on default messages", function() {
      var spy = sinon.spy();
      client.subscribeAll(spy);
      var message = {
        action: 'built',
        time: 100,
        hash: 'deadbeeffeddad',
        errors: [],
        warnings: [],
        modules: []
      };

      var socket = io.connect.lastCall.returnValue;
      socket.emit('message', message);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, message);
    });
    it("should call subscribeAll handler on custom messages", function() {
      var spy = sinon.spy();
      client.subscribeAll(spy);

      var socket = io.connect.lastCall.returnValue;
      socket.emit('message', {
        action: 'thingy'
      });

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { action: 'thingy' });
    });
    it("should call only custom handler on custom messages", function() {
      var spy = sinon.spy();
      client.subscribe(spy);

      var socket = io.connect.lastCall.returnValue;
      socket.emit('message', {
        custom: 'thingy'
      });
      socket.emit('message', {
        action: 'built'
      });

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { custom: 'thingy' });
      sinon.assert.notCalled(processUpdate);
    });
    it("should test more of the client's functionality");
  });

  context("with no browser environment", function() {
    beforeEach(function setup() {
      global.__resourceQuery = ''; // eslint-disable-line no-underscore-dangle
      delete global.window;
    });
    beforeEach(loadClient);
    it("should not connect", function() {
      // doesn't error
    });
  });

  function loadClient() {
    var path = require.resolve('../client');
    delete require.cache[path];
    client = require(path);
  }

  beforeEach(function() {
    clientOverlay = {
      exports: { showProblems: sinon.stub(), clear: sinon.stub() }
    };
    require.cache[require.resolve('../client-overlay')] = clientOverlay;

    processUpdate = sinon.stub();
    require.cache[require.resolve('../process-update')] = {
      exports: processUpdate
    };

    var socket = new (events.EventEmitter)();
    sinon.stub(io, 'connect').returns(socket);

    require.cache[require.resolve('socket.io-client')] = {
      exports: io
    };
  });
  afterEach(function() {
    delete require.cache[require.resolve('../client-overlay')];
    delete require.cache[require.resolve('../process-update')];
    delete require.cache[require.resolve('socket.io-client')];
    io.connect.restore();
  });
});
