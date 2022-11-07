/* eslint-env mocha */
var path = require('path');
var qs = require('querystring');

var express = require('express');
var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');

var assert = require('assert');
var supertest = require('supertest');

var webpackHotMiddleware = require('../middleware');

var app;

describe('realistic single compiler', function () {
  var compiler;
  var clientCode = path.resolve(__dirname, './fixtures/single/client.js');
  before(function () {
    require('fs').writeFileSync(clientCode, 'var a = ' + Math.random() + ';\n');

    compiler = webpack({
      mode: 'development',
      entry: [
        require.resolve('./fixtures/single/client.js'),
        require.resolve('../client.js'),
      ],
      plugins: [new webpack.HotModuleReplacementPlugin()],
    });

    app = express();
    app.use(
      webpackDevMiddleware(compiler, {
        publicPath: '/',
        // stats: 'none',
      })
    );
    app.use(
      webpackHotMiddleware(compiler, {
        log: function () {},
      })
    );
  });

  it('should create eventStream on /__webpack_hmr', function (done) {
    request('/__webpack_hmr')
      .expect('Content-Type', /^text\/event-stream\b/)
      .end(done);
  });

  describe('first build', function () {
    it('should publish sync event', function (done) {
      request('/__webpack_hmr')
        .expect('Content-Type', /^text\/event-stream\b/)
        .end(function (err, res) {
          if (err) return done(err);

          var event = JSON.parse(res.events[0].substring(5));

          assert.equal(event.action, 'sync');
          assert.equal(event.name, '');
          assert.ok(event.hash);
          assert.ok(event.time);
          assert.ok(Array.isArray(event.warnings));
          assert.ok(Array.isArray(event.errors));
          assert.ok(typeof event.modules === 'object');

          done();
        });
    });
  });
  describe('after file change', function () {
    var res;
    before(function (done) {
      request('/__webpack_hmr')
        .expect('Content-Type', /^text\/event-stream\b/)
        .end(function (err, _res) {
          if (err) return done(err);

          res = _res;

          require('fs').writeFile(
            clientCode,
            'var a = ' + Math.random() + ';\n',
            done
          );
        });
    });
    it('should publish building event', function (done) {
      waitUntil(
        function () {
          return res.events.length >= 2;
        },
        function () {
          var event = JSON.parse(res.events[1].substring(5));

          assert.equal(event.action, 'building');

          done();
        }
      );
    });
    it('should publish built event', function (done) {
      waitUntil(
        function () {
          return res.events.length >= 3;
        },
        function () {
          var event = JSON.parse(res.events[2].substring(5));

          assert.equal(event.action, 'built');
          assert.equal(event.name, '');
          assert.ok(event.hash);
          assert.ok(event.time);
          assert.ok(Array.isArray(event.warnings));
          assert.ok(Array.isArray(event.errors));
          assert.ok(typeof event.modules === 'object');

          done();
        }
      );
    });
  });
});

describe('realistic multi compiler', function () {
  var multiCompiler;

  var compilationConfig = [
    {
      name: 'first',
      entryPath: path.join(
        __dirname,
        './fixtures/multi-compiler/first-compilation-client.js'
      ),
    },
    {
      name: 'second',
      entryPath: path.join(
        __dirname,
        './fixtures/multi-compiler/second-compilation-client.js'
      ),
    },
  ];

  before(function () {
    multiCompiler = webpack(
      compilationConfig.map(function (compilation) {
        require('fs').writeFileSync(
          compilation.entryPath,
          'var a = ' + Math.random() + ';\n'
        );

        return {
          name: compilation.name,
          mode: 'development',
          entry: [
            require.resolve(compilation.entryPath),
            path.join(
              __dirname,
              '../client.js' +
                '?=' +
                qs.stringify({
                  name: compilation.name,
                })
            ),
          ],
          plugins: [new webpack.HotModuleReplacementPlugin()],
        };
      })
    );

    app = express();
    app.use(
      webpackDevMiddleware(multiCompiler, {
        publicPath: '/',
        // stats: 'none',
      })
    );
    app.use(
      webpackHotMiddleware(multiCompiler, {
        log: function () {},
      })
    );
  });

  it('should create eventStream on /__webpack_hmr', function (done) {
    request('/__webpack_hmr')
      .expect('Content-Type', /^text\/event-stream\b/)
      .end(done);
  });

  describe('first build', function () {
    it('should publish sync event for all compilations from multi compiler', function (done) {
      request('/__webpack_hmr')
        .expect('Content-Type', /^text\/event-stream\b/)
        .end(function (err, res) {
          if (err) return done(err);

          assert.equal(res.events.length, compilationConfig.length);

          res.events.forEach(function (resEvent, idx) {
            var event = JSON.parse(resEvent.substring(5));
            assert.equal(event.action, 'sync');
            assert.equal(event.name, compilationConfig[idx].name);
            assert.ok(event.hash);
            assert.ok(event.time);
            assert.ok(Array.isArray(event.warnings));
            assert.ok(Array.isArray(event.errors));
            assert.ok(typeof event.modules === 'object');
          });

          done();
        });
    });
  });

  describe('after file change', function () {
    var res;

    before(function (done) {
      request('/__webpack_hmr')
        .expect('Content-Type', /^text\/event-stream\b/)
        .end(function (err, _res) {
          if (err) return done(err);

          res = _res;

          // simulate write to a random entry of the compilation config list
          require('fs').writeFile(
            compilationConfig[
              Math.floor(Math.random() * compilationConfig.length)
            ].entryPath,
            'var a = ' + Math.random() + ';\n',
            done
          );
        });
    });

    it('should publish building event', function (done) {
      waitUntil(
        function () {
          // building phase is after sync phase, but because we only change one file
          // we expect compilationConfig length + 1 events
          return res.events.length >= compilationConfig.length + 1;
        },
        function () {
          var phaseEvents = res.events.slice(compilationConfig.length);

          phaseEvents.forEach(function (phaseEvent) {
            var event = JSON.parse(phaseEvent.substring(5));

            assert.equal(event.action, 'building');
          });

          done();
        }
      );
    });

    it('should publish built event', function (done) {
      waitUntil(
        function () {
          // built is 3rd phase, right after building
          // we expect to have received 2 batches of events for all entries of the compilationConfig
          // in addition to the single event fired for our simulated write
          return res.events.length >= 2 * compilationConfig.length + 1;
        },
        function () {
          var phaseEvents = res.events.slice(compilationConfig.length + 1);

          phaseEvents.forEach(function (phaseEvent, idx) {
            var event = JSON.parse(phaseEvent.substring(5));

            assert.equal(event.action, 'built');
            assert.equal(event.name, compilationConfig[idx].name);
            assert.ok(event.hash);
            assert.ok(event.time);
            assert.ok(Array.isArray(event.warnings));
            assert.ok(Array.isArray(event.errors));
            assert.ok(typeof event.modules === 'object');
          });

          done();
        }
      );
    });
  });
});

function request(path) {
  // Wrap some stuff up so supertest works with streaming responses
  var req = supertest(app).get(path).buffer(false);
  var end = req.end;
  req.end = function (callback) {
    req.on('error', callback).on('response', function (res) {
      Object.defineProperty(res, 'events', {
        get: function () {
          return res.text.trim().split('\n\n');
        },
      });
      res.on('data', function (chunk) {
        res.text = (res.text || '') + chunk;
      });
      process.nextTick(function () {
        req.assert(null, res, function (err) {
          callback(err, res);
        });
      });
    });

    end.call(req, function () {});
  };
  return req;
}

function waitUntil(condition, body) {
  if (condition()) {
    body();
  } else {
    setTimeout(function () {
      waitUntil(condition, body);
    }, 50);
  }
}
