/* eslint-env mocha, browser */

var sinon = require('sinon');

describe("client", function() {
  var client, clientOverlay, processUpdate;

  context("with default options", function() {
    beforeEach(setup());
    beforeEach(loadClient);
    it("should connect to __webpack_hmr", function() {
      sinon.assert.calledOnce(window.EventSource);
      sinon.assert.calledWithNew(window.EventSource);
      sinon.assert.calledWith(window.EventSource, '/__webpack_hmr');
    });
    it("should trigger webpack on successful builds", function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(makeMessage({
        action: 'built',
        time: 100,
        hash: 'deadbeeffeddad',
        errors: [],
        warnings: [],
        modules: []
      }));
      sinon.assert.calledOnce(processUpdate);
    });
    it("should call only custom handler on custom messages", function() {
      var spy = sinon.spy();
      client.subscribe(spy);

      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(makeMessage({
        custom: 'thingy'
      }));

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { custom: 'thingy' });
      sinon.assert.notCalled(processUpdate);
    });
    it("should test more of the client's functionality");
  });

  function makeMessage(obj) {
    return { data: typeof obj === 'string' ? obj : JSON.stringify(obj) };
  }

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
  });
  afterEach(function() {
    delete require.cache[require.resolve('../client-overlay')];
    delete require.cache[require.resolve('../process-update')];
  });

  function setup(options) {
    options = options || {};
    return function() {
      global.__resourceQuery = options.resourceQuery || ''; // eslint-disable-line no-underscore-dangle, max-len
      global.window = {
        EventSource: sinon.stub().returns({
          close: sinon.spy()
        })
      };
    };
  }
});
