# Webpack Hot Middleware

Webpack hot reloading using only [webpack-dev-middleware](http://webpack.github.io/docs/webpack-dev-middleware.html). This allows you to add hot reloading into an existing server without [webpack-dev-server](http://webpack.github.io/docs/webpack-dev-server.html).

## Installation & Usage

See [example/](./example/) for an example of usage.

First, install the npm module.

```sh
npm install --save-dev webpack-hot-middleware
```

Next, enable hot reloading in your webpack config:

 1. Add the following three plugins to the `plugins` array:
    ```js
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ]
    ```
    Occurence ensures consistent build hashes, hot module replacement is
    somewhat self-explanatory, no errors is used to handle errors more cleanly.

 3. Add `'webpack-hot-middleware/client'` into the `entry` array.
    This connects to the server to receive notifications when the bundle
    rebuilds and then updates your client bundle accordingly.

Now add the middleware into your server:

 1. Add `webpack-dev-middleware` the usual way
    ```js
    var webpack = require('webpack');
    var webpackConfig = require('./webpack.config');
    var compiler = webpack(webpackConfig);

    app.use(require("webpack-dev-middleware")(compiler, {
        noInfo: true, publicPath: webpackConfig.output.publicPath
    }));
    ```

 2. Add `webpack-hot-middleware` attached to the same compiler instance
    ```js
    app.use(require("webpack-hot-middleware")(compiler));
    ```

And you're all set!

## Changelog

### 2.0.0

** Breaking Change **

As of version 2.0.0, all client functionality has been rolled into this module. This means that you should remove any reference to `webpack/hot/dev-server` or `webpack/hot/only-dev-server` from your webpack config. Instead, use the `reload` config option to control this behaviour.

This was done to allow full control over the client receiving updates, which is now able to output full module names in the console when applying changes.

## Documentation

More to come soon, you'll have to mostly rely on the example for now.

### Config

Configuration options can be passed to the client by adding querystring parameters to the path in the webpack config.

```js
'webpack-hot-middleware/client?path=/__what&timeout=2000&overlay=false'
```

* **path** - The path which the middleware is serving the event stream on
* **timeout** - The time to wait after a disconnection before attempting to reconnect
* **overlay** - Set to `false` to disable the DOM-based client-side overlay.
* **reload** - Set to `true` to auto-reload the page when webpack gets stuck.

## License

Copyright 2015 Glen Mailer.

MIT Licened.
