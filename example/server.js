var app = require('express')();
var server = require('http').Server(app);

app.use(require('morgan')('short'));

// ************************************
// This is the real meat of the example
// ************************************
(function() {
  // Step 1: Create & configure a webpack compiler
  var webpack = require('webpack');
  var webpackConfig = require(process.env.WEBPACK_CONFIG ? process.env.WEBPACK_CONFIG : './webpack.config');
  var compiler = webpack(webpackConfig);

  // Step 2: Attach the dev middleware to the compiler & the server
  app.use(require("webpack-dev-middleware")(compiler, {
    noInfo: true, publicPath: webpackConfig.output.publicPath
  }));

  // Step 3: Attach the hot middleware to the compiler & the http server
  app.use(require("webpack-hot-middleware")(compiler));
})();

// Do anything you like with the rest of your express application.

app.get("/", function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.get("/multientry", function(req, res) {
  res.sendFile(__dirname + '/index-multientry.html');
});

if (require.main === module) {
  server.listen(process.env.PORT || 1616, function() {
    console.log("Listening on %j", server.address());
  });
}
