/*eslint-env browser*/
/*global __resourceQuery*/

var options = {
  path: "/__webpack_hmr",
  timeout: 20 * 1000,
  overlay: true
};
if (__resourceQuery) {
  var pathMatch = /path=(.*?)(\&|$)/.exec(__resourceQuery);
  if (pathMatch) {
    options.path = pathMatch[1];
  }
  var timeoutMatch = /timeout=(.*?)(\&|$)/.exec(__resourceQuery);
  if (timeoutMatch) {
    options.timeout = parseFloat(timeoutMatch[1]);
  }
  var overlayMatch = /overlay=(.*?)(\&|$)/.exec(__resourceQuery);
  if (overlayMatch) {
    options.overlay = overlayMatch[1] !== 'false';
  }
}

connect();

function connect() {
  var source = new window.EventSource(options.path);
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
    console.log("[HMR] connected");
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
      console.warn("Invalid HMR message: " + event.data + "\n" + ex);
    }
  }

  function handleDisconnect() {
    clearInterval(timer);
    source.close();
    setTimeout(connect, options.timeout);
  }

}

var strip = require('strip-ansi');

var overlay;
if (options.overlay) {
  overlay = require('./client-overlay');
}

function problems(type, obj) {
  console.warn("[HMR] bundle has " + type + ":");
  var list = [];
  obj[type].forEach(function(msg) {
    var clean = strip(msg);
    console.warn("[HMR] " + clean);
    list.push(clean);
  });
  if (overlay) overlay.showProblems(list);
}
function success() {
  if (overlay) overlay.clear();
}


function processMessage(obj) {
  if (obj.action == "building") {
    console.log("[HMR] bundle rebuilding");
  } else if (obj.action == "built") {
    console.log("[HMR] bundle rebuilt in " + obj.time + "ms");
    if (obj.errors.length > 0) {
      problems('errors', obj);
    } else if (obj.warnings.length > 0) {
      problems('warnings', obj);
    } else {
      success();
      window.postMessage("webpackHotUpdate" + obj.hash, "*");
    }
  }
}
