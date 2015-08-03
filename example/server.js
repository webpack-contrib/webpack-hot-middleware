var http = require('http');

var express = require('express');
var assign = require('object-assign');

var app = express();

app.use(require('morgan')('short'));

// ************************************
// This is the real meat of the example
// ************************************
(function() {

  // Step 1: Create & configure a webpack compiler
  var webpack = require('webpack');
  var webpackConfig = require('./webpack.config');
  var clientConfig = assign({}, webpackConfig);
  clientConfig.entry = [
    // Webpack comes with client code to check & reload modules
    'webpack/hot/dev-server',
    // We need to add our own code to receive module change notifications
    'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
    // And then the actual application
    clientConfig.entry
  ];
  clientConfig.output = assign({}, clientConfig.output, {
    filename: 'bundle.js'
  });
  var clientCompiler = webpack(clientConfig);

  // Step 2: Attach the dev middleware to the compiler & the server
  app.use(require("webpack-dev-middleware")(clientCompiler, {
    noInfo: true, publicPath: clientConfig.output.publicPath
  }));

  // Step 3: Attach the hot middleware to the compiler & the server
  app.use(require("webpack-hot-middleware")(clientCompiler, {
    log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000
  }));
  
  // Step 4: Setup server side hot reloading
  var serverConfig = assign({}, webpackConfig);
  serverConfig.entry = [
    // Webpack will hot reload our module when we signal it
    'webpack/hot/signal?hot-reload',
    // And then the actual application
    './server-hot-example-module.js'
  ];
  serverConfig.target = 'node';
  serverConfig.output = assign({}, serverConfig.output, {
    filename: 'server-bundle.js',
    libraryTarget: 'commonjs',
    path: __dirname + '/build'
  });
  var serverCompiler = webpack(serverConfig);
  serverCompiler.watch(200, function(err) {
    if (err) {
      console.warn(err);
      return;
    }
    process.emit('hot-reload');
    hotServerExampleModule = require('./build/server-bundle');
    console.log('Server bundle compiled.');
  });
})();

// Do anything you like with the rest of your express application.

app.get("/", function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

var hotServerExampleModule;

app.get("/counter", function(req, res) {
  res.json(hotServerExampleModule.api.fn());
});

if (require.main === module) {
  var server = http.createServer(app);
  server.listen(process.env.PORT || 1616, function() {
    console.log("Listening on %j", server.address());
  });
}
