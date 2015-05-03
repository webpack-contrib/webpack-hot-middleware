var http = require('http');

var express = require('express');

var app = express();

app.use(require('morgan')('short'));

// ************************************
// This is the real meat of the example
// ************************************
(function() {
  var webpack = require('webpack');
  var webpackConfig = require('./webpack.config');
  var compiler = webpack(webpackConfig);
  app.use(require("webpack-dev-middleware")(compiler, {
    noInfo: true, publicPath: webpackConfig.output.publicPath
  }));
  app.use(webpackHotMiddleware(compiler, {
    log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000
  }));
})();

function webpackHotMiddleware(compiler, opts) {
  var eventStream = createEventStream(opts.heartbeat || 10 * 1000);
  compiler.plugin("compile", function() {
    if (opts.log) opts.log("webpack building...");
    eventStream.publish({action: "building"});
  });
  compiler.plugin("done", function(stats) {
    stats = stats.toJson();
    if (opts.log) {
      opts.log("webpack built " + stats.hash + " in " + stats.time + "ms");
    }
    eventStream.publish({
      action: "built",
      time: stats.time,
      hash: stats.hash,
      warnings: stats.warnings || [],
      errors: stats.errors || []
    });
  });
  return function(req, res, next) {
    if (req.url !== opts.path) return next();
    eventStream.handler(req, res);
  };
}

function createEventStream(heartbeat) {
  var clientId = 0;
  var clients = {};
  function everyClient(fn) {
    Object.keys(clients).forEach(function(id) {
      fn(clients[id]);
    });
  }
  setInterval(function heartbeat() {
    everyClient(function(client) {
      client.write("data: \uD83D\uDC93\n\n");
    });
  }, heartbeat).unref();
  return {
    handler: function(req, res) {
      req.socket.setKeepAlive(true);
      res.writeHead(200, {
        'Content-Type': 'text/event-stream;charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write('\n');
      var id = clientId++;
      clients[id] = res;
      req.on("close", function(){
        delete clients[id];
      });
    },
    publish: function(payload) {
      everyClient(function(client) {
          client.write("data: " + JSON.stringify(payload) + "\n\n");
      });
    }
  };
}

// Do anything you like with the rest of your express application.
app.get('/api/statistics', function(req, res) {
  res.json({
    now: new Date(),
    profit: Math.random() * 1e6,
    synergy: Number((Math.random() * 100).toFixed(2)),
  });
});

app.get("/", function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

if (require.main === module) {
  var server = http.createServer(app);
  server.listen(process.env.PORT || 1616, function() {
    console.log("Listening on %j", server.address());
  });
}
