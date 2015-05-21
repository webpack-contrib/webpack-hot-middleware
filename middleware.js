module.exports = webpackHotMiddleware;

function webpackHotMiddleware(compiler, opts) {
  opts = opts || {};
  opts.log = typeof opts.log == 'undefined' ? console.log : opts.log;
  opts.path = opts.path || '/__webpack_hmr';
  opts.heartbeat = opts.heartbeat || 10 * 1000;

  var eventStream = createEventStream(opts.heartbeat);
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
        'Access-Control-Allow-Origin': '*',
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
