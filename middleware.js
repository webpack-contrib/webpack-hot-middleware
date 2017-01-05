module.exports = webpackHotMiddleware;

var helpers = require('./helpers');
var pathMatch = helpers.pathMatch;
var detectConstDependency = helpers.detectConstDependency;

function webpackHotMiddleware(compiler, opts) {
  opts = opts || {};
  opts.log = typeof opts.log == 'undefined' ? console.log.bind(console) : opts.log;
  opts.path = opts.path || '/__webpack_hmr';
  opts.heartbeat = opts.heartbeat || 10 * 1000;

  var eventStream = createEventStream(opts.heartbeat);
  var latestStats = null;

  var compilers = compiler.compilers || [compiler];
  compilers.forEach(function(compiler, index) {
    compiler.id = "__WEBPACK_COMPILER_" + index + "__";
    compiler.plugin("compilation", function (compilation, params) {
      var hotUpdateChunkTemplate = compilation.hotUpdateChunkTemplate;
      if(!hotUpdateChunkTemplate) return;

      compilation.mainTemplate.plugin("require-extensions", function(source) {
        var buf = [source];
        buf.push("");
        buf.push("// __webpack_compiler__");
        buf.push(this.requireFn + ".compiler = function() { return " + JSON.stringify(compiler.id) + "; };");
        return this.asString(buf);
      });
    });
    compiler.parser.plugin("expression __webpack_compiler__", function(expr) {
      var ConstDependency = detectConstDependency(this.state.compilation);
      if (!ConstDependency) return true;

      var dep = new ConstDependency("__webpack_require__.compiler()", expr.range);
      dep.loc = expr.loc;
      this.state.current.addDependency(dep);
      return true;
    });
  });

  compiler.plugin("compile", function() {
    latestStats = null;
    if (opts.log) opts.log("webpack building...");
    eventStream.publish({action: "building"});
  });
  compiler.plugin("done", function(statsResult) {
    // Keep hold of latest stats so they can be propagated to new clients
    latestStats = statsResult;
    publishStats("built", latestStats, eventStream, opts.log);
  });
  var middleware = function(req, res, next) {
    if (!pathMatch(req.url, opts.path)) return next();
    eventStream.handler(req, res);
    if (latestStats) {
      // Explicitly not passing in `log` fn as we don't want to log again on
      // the server
      publishStats("sync", latestStats, eventStream);
    }
  };
  middleware.publish = eventStream.publish;
  return middleware;
}

function createEventStream(heartbeat) {
  var clientId = 0;
  var clients = {};
  function everyClient(fn) {
    Object.keys(clients).forEach(function(id) {
      fn(clients[id]);
    });
  }
  setInterval(function heartbeatTick() {
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
        'Cache-Control': 'no-cache, no-transform',
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

function publishStats(action, statsResult, eventStream, log) {
  // For multi-compiler, stats will be an object with a 'children' array of stats
  var bundles = extractBundles(statsResult.toJson({ errorDetails: false }));
  bundles.forEach(function(stats, index) {
    if (log) {
      log("webpack built " + (stats.name ? stats.name + " " : "") +
        stats.hash + " in " + stats.time + "ms");
    }
    var compiler = statsResult.stats
      ? statsResult.stats[index].compilation.compiler.id
      : statsResult.compilation.compiler.id;
    eventStream.publish({
      name: stats.name,
      compiler: compiler,
      action: action,
      time: stats.time,
      hash: stats.hash,
      warnings: stats.warnings || [],
      errors: stats.errors || [],
      modules: buildModuleMap(stats.modules)
    });
  });
}

function extractBundles(stats) {
  // Stats has modules, single bundle
  if (stats.modules) return [stats];

  // Stats has children, multiple bundles
  if (stats.children && stats.children.length) return stats.children;

  // Not sure, assume single
  return [stats];
}

function buildModuleMap(modules) {
  var map = {};
  modules.forEach(function(module) {
    map[module.id] = module.name;
  });
  return map;
}
