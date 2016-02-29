/*eslint-env browser*/
/*global __resourceQuery*/

var options = {
  path: "/__webpack_hmr",
  timeout: 20 * 1000,
  overlay: true,
  reload: false,
  log: true,
  warn: true
};
if (__resourceQuery) {
  var querystring = require('querystring');
  var overrides = querystring.parse(__resourceQuery.slice(1));
  if (overrides.path) options.path = overrides.path;
  if (overrides.timeout) options.timeout = overrides.timeout;
  if (overrides.overlay) options.overlay = overrides.overlay !== 'false';
  if (overrides.reload) options.reload = overrides.reload !== 'false';
  if (overrides.noInfo && overrides.noInfo !== 'false') {
    options.log = false;
  }
  if (overrides.quiet && overrides.quiet !== 'false') {
    options.log = false;
    options.warn = false;
  }
}

if (typeof window === 'undefined') {
  // do nothing
} else if (typeof window.EventSource === 'undefined') {
  console.warn(
    "webpack-hot-middleware's client requires EventSource to work. " +
    "You should include a polyfill if you want to support this browser: " +
    "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events#Tools"
  );
} else {
  connect(window.EventSource);
}

function connect(EventSource) {
  var source = new EventSource(options.path);
  var lastActivity = new Date();

  source.onopen = handleOnline;
  source.onmessage = handleMessage;
  source.onerror = handleDisconnect;

  var timer = setInterval(function() {
    if ((new Date() - lastActivity) > options.timeout) {
      handleDisconnect();
    }
  }, options.timeout / 2);

  function handleOnline() {
    if (options.log) console.log("[HMR] connected");
    lastActivity = new Date();
  }

  function handleMessage(event) {
    lastActivity = new Date();
    if (event.data == "\uD83D\uDC93") {
      return;
    }
    try {
      processMessage(JSON.parse(event.data));
    } catch (ex) {
      if (options.warn) {
        console.warn("Invalid HMR message: " + event.data + "\n" + ex);
      }
    }
  }

  function handleDisconnect() {
    clearInterval(timer);
    source.close();
    setTimeout(function() { connect(EventSource); }, options.timeout);
  }

}

var strip = require('strip-ansi');
var Ansi = require('ansi-to-html-umd');
var ansi = new Ansi({
  escapeXML: true
});

var overlay;
if (typeof document !== 'undefined' && options.overlay) {
  overlay = require('./client-overlay');
}

function problems(type, obj) {
  if (options.warn) console.warn("[HMR] bundle has " + type + ":");
  var list = [];
  obj[type].forEach(function(msg) {
    if (options.warn) console.warn("[HMR] " + strip(msg));
    list.push(ansi.toHtml(msg));
  });
  if (overlay && type !== 'warnings') overlay.showProblems(list);
}

function success() {
  if (overlay) overlay.clear();
}

var processUpdate = require('./process-update');

var customHandler;
function processMessage(obj) {
  if (obj.action == "building") {
    if (options.log) console.log("[HMR] bundle rebuilding");
  } else if (obj.action == "built") {
    if (options.log) console.log("[HMR] bundle " + (obj.name ? obj.name + " " : "") + "rebuilt in " + obj.time + "ms");
    if (obj.errors.length > 0) {
      problems('errors', obj);
    } else {
      if (obj.warnings.length > 0) problems('warnings', obj);
      success();

      processUpdate(obj.hash, obj.modules, options);
    }
  } else if (customHandler) {
    customHandler(obj);
  }
}

if (module) {
  module.exports = {
    subscribe: function subscribe(handler) {
      customHandler = handler;
    },
    useCustomOverlay: function useCustomOverlay(customOverlay) {
      overlay = customOverlay;
    }
  };
}
