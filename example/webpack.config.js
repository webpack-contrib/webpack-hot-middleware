var webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: [
    'webpack/hot/dev-server',
    './__webpack_hmr.js?path=/__webpack_hmr&timeout=20000',
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
