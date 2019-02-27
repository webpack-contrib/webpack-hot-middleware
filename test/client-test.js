/* eslint-env mocha, browser */

var sinon = require('sinon');

describe('client', function() {
  var s, client, clientOverlay, processUpdate;

  beforeEach(function() {
    s = sinon.sandbox.create({ useFakeTimers: true });
  });
  afterEach(function() {
    s.restore();
  });

  context('with default options', function() {
    beforeEach(function setup() {
      global.__resourceQuery = ''; // eslint-disable-line no-underscore-dangle
      global.document = {};
      global.window = {
        EventSource: sinon.stub().returns({
          close: sinon.spy(),
        }),
      };
    });
    beforeEach(loadClient);
    it('should connect to __webpack_hmr', function() {
      sinon.assert.calledOnce(window.EventSource);
      sinon.assert.calledWithNew(window.EventSource);
      sinon.assert.calledWith(window.EventSource, '/__webpack_hmr');
    });
    it('should trigger webpack on successful builds', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: [],
          modules: [],
        })
      );
      sinon.assert.calledOnce(processUpdate);
    });
    it('should trigger webpack on successful syncs', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'sync',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: [],
          modules: [],
        })
      );
      sinon.assert.calledOnce(processUpdate);
    });
    it('should call subscribeAll handler on default messages', function() {
      var spy = sinon.spy();
      client.subscribeAll(spy);
      var message = {
        action: 'built',
        time: 100,
        hash: 'deadbeeffeddad',
        errors: [],
        warnings: [],
        modules: [],
      };

      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(makeMessage(message));

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, message);
    });
    it('should call subscribeAll handler on custom messages', function() {
      var spy = sinon.spy();
      client.subscribeAll(spy);

      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'thingy',
        })
      );

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { action: 'thingy' });
    });
    it('should call only custom handler on custom messages', function() {
      var spy = sinon.spy();
      client.subscribe(spy);

      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          custom: 'thingy',
        })
      );
      eventSource.onmessage(
        makeMessage({
          action: 'built',
        })
      );

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { custom: 'thingy' });
      sinon.assert.notCalled(processUpdate);
    });
    it('should not trigger webpack on errored builds', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: ['Something broke'],
          warnings: [],
          modules: [],
        })
      );
      sinon.assert.notCalled(processUpdate);
    });
    it('should show overlay on errored builds', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: ['Something broke', 'Actually, 2 things broke'],
          warnings: [],
          modules: [],
        })
      );
      sinon.assert.calledOnce(clientOverlay.showProblems);
      sinon.assert.calledWith(clientOverlay.showProblems, 'errors', [
        'Something broke',
        'Actually, 2 things broke',
      ]);
    });
    it('should hide overlay after errored build fixed', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: ['Something broke', 'Actually, 2 things broke'],
          warnings: [],
          modules: [],
        })
      );
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: [],
          modules: [],
        })
      );
      sinon.assert.calledOnce(clientOverlay.showProblems);
      sinon.assert.calledOnce(clientOverlay.clear);
    });
    it('should hide overlay after errored build becomes warning', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: ['Something broke', 'Actually, 2 things broke'],
          warnings: [],
          modules: [],
        })
      );
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: ["This isn't great, but it's not terrible"],
          modules: [],
        })
      );
      sinon.assert.calledOnce(clientOverlay.showProblems);
      sinon.assert.calledOnce(clientOverlay.clear);
    });
    it('should trigger webpack on warning builds', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: ["This isn't great, but it's not terrible"],
          modules: [],
        })
      );
      sinon.assert.calledOnce(processUpdate);
    });
    it('should not overlay on warning builds', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: ["This isn't great, but it's not terrible"],
          modules: [],
        })
      );
      sinon.assert.notCalled(clientOverlay.showProblems);
    });
    it('should show overlay after warning build becomes error', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: ["This isn't great, but it's not terrible"],
          modules: [],
        })
      );
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: ['Something broke', 'Actually, 2 things broke'],
          warnings: [],
          modules: [],
        })
      );
      sinon.assert.calledOnce(clientOverlay.showProblems);
    });
    it("should test more of the client's functionality");
  });

  context('with overlayWarnings: true', function() {
    beforeEach(function setup() {
      global.__resourceQuery = '?overlayWarnings=true'; // eslint-disable-line no-underscore-dangle
      global.document = {};
      global.window = {
        EventSource: sinon.stub().returns({
          close: sinon.spy(),
        }),
      };
    });
    beforeEach(loadClient);
    it('should show overlay on errored builds', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: ['Something broke', 'Actually, 2 things broke'],
          warnings: [],
          modules: [],
        })
      );
      sinon.assert.calledOnce(clientOverlay.showProblems);
      sinon.assert.calledWith(clientOverlay.showProblems, 'errors', [
        'Something broke',
        'Actually, 2 things broke',
      ]);
    });
    it('should hide overlay after errored build fixed', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: ['Something broke', 'Actually, 2 things broke'],
          warnings: [],
          modules: [],
        })
      );
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: [],
          modules: [],
        })
      );
      sinon.assert.calledOnce(clientOverlay.showProblems);
      sinon.assert.calledOnce(clientOverlay.clear);
    });
    it('should show overlay on warning builds', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: ["This isn't great, but it's not terrible"],
          modules: [],
        })
      );
      sinon.assert.calledOnce(clientOverlay.showProblems);
      sinon.assert.calledWith(clientOverlay.showProblems, 'warnings', [
        "This isn't great, but it's not terrible",
      ]);
    });
    it('should hide overlay after warning build fixed', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: ["This isn't great, but it's not terrible"],
          modules: [],
        })
      );
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: [],
          modules: [],
        })
      );
      sinon.assert.calledOnce(clientOverlay.showProblems);
      sinon.assert.calledOnce(clientOverlay.clear);
    });
    it('should update overlay after errored build becomes warning', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: ['Something broke', 'Actually, 2 things broke'],
          warnings: [],
          modules: [],
        })
      );
      eventSource.onmessage(
        makeMessage({
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: ["This isn't great, but it's not terrible"],
          modules: [],
        })
      );
      sinon.assert.calledTwice(clientOverlay.showProblems);
      sinon.assert.calledWith(clientOverlay.showProblems, 'errors');
      sinon.assert.calledWith(clientOverlay.showProblems, 'warnings');
    });
  });

  context('with name options', function() {
    beforeEach(function setup() {
      global.__resourceQuery = '?name=test'; // eslint-disable-line no-underscore-dangle
      global.window = {
        EventSource: sinon.stub().returns({
          close: sinon.spy(),
        }),
      };
    });
    beforeEach(loadClient);
    it('should not trigger webpack if event obj name is different', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          name: 'foo',
          action: 'built',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: [],
          modules: [],
        })
      );
      sinon.assert.notCalled(processUpdate);
    });
    it('should not trigger webpack on successful syncs if obj name is different', function() {
      var eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(
        makeMessage({
          name: 'bar',
          action: 'sync',
          time: 100,
          hash: 'deadbeeffeddad',
          errors: [],
          warnings: [],
          modules: [],
        })
      );
      sinon.assert.notCalled(processUpdate);
    });
  });

  context('with no browser environment', function() {
    beforeEach(function setup() {
      global.__resourceQuery = ''; // eslint-disable-line no-underscore-dangle
      delete global.window;
    });
    beforeEach(loadClient);
    it('should not connect', function() {
      // doesn't error
    });
  });

  context('with no EventSource', function() {
    beforeEach(function setup() {
      global.__resourceQuery = ''; // eslint-disable-line no-underscore-dangle
      global.window = {};
      s.stub(console, 'warn');
    });
    beforeEach(loadClient);
    it('should emit warning and not connect', function() {
      sinon.assert.calledOnce(console.warn);
      sinon.assert.calledWithMatch(console.warn, /EventSource/);
    });
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
    clientOverlay = { showProblems: sinon.stub(), clear: sinon.stub() };
    var clientOverlayModule = {
      exports: function() {
        return clientOverlay;
      },
    };
    require.cache[require.resolve('../client-overlay')] = clientOverlayModule;

    processUpdate = sinon.stub();
    require.cache[require.resolve('../process-update')] = {
      exports: processUpdate,
    };
  });
  afterEach(function() {
    delete require.cache[require.resolve('../client-overlay')];
    delete require.cache[require.resolve('../process-update')];
  });
});
