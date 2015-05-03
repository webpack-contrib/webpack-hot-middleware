var webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: [
    // Webpack comes with client code to check & reload modules
    'webpack/hot/dev-server',
    // We need to add our own code to receive module change notifications
    'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
    // And then the actual application
    './client.js'
  ],
  output: {
    path: __dirname,
    publicPath: '/',
    filename: 'bundle.js'
  },
  devtool: '#source-map',
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ]
};
