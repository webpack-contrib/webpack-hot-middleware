/*eslint-env browser*/
/*global __resourceQuery*/
//var strip = require('strip-ansi');

var options = {
  path: "/__webpack_hmr",
  timeout: 20 * 1000
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
    setTimeout(connect, 500);
  }

}

function processMessage(obj) {
  if (obj.action == "building") {
    console.log("[HMR] bundle rebuilding");
  } else if (obj.action == "built") {
    console.log("[HMR] bundle rebuilt in " + obj.time + "ms");
    if (obj.errors.length > 0) {
      showProblems('errors', obj);
    } else if (obj.warnings.length > 0) {
      showProblems('warnings', obj);
    } else {
      hideProblems();
      window.postMessage("webpackHotUpdate" + obj.hash, "*");
    }
  }
}

var problemOverlay = document.createElement('div');
problemOverlay.style.display = 'none';
problemOverlay.style.background = '#fdd';
problemOverlay.style.color = '#000';
problemOverlay.style.position = 'fixed';
problemOverlay.style.zIndex = 9999;
problemOverlay.style.left = 0;
problemOverlay.style.right = 0;
problemOverlay.style.top = 0;
problemOverlay.style.bottom = 0;
problemOverlay.style.overflow = 'auto';

document.body.appendChild(problemOverlay);

function showProblems(type, obj) {
  console.warn("[HMR] bundle has " + type + ":");
  problemOverlay.innerHTML = '';
  problemOverlay.style.display = 'block';
  obj[type].forEach(function(msg) {
    var clean = msg;//strip(msg);
    console.warn("[HMR] " + clean);
    var pre = document.createElement('pre');
    pre.textContent = clean;
    problemOverlay.appendChild(pre);
  });
}
function hideProblems() {
  problemOverlay.innerHTML = '';
  problemOverlay.style.display = 'none';
}
