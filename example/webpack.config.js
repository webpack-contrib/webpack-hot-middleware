var webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: './client.js',
  output: {
    path: __dirname,
    publicPath: '/'
  },
  devtool: '#source-map',
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ]
};
