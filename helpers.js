var parse = require('url').parse;

exports.pathMatch = function(url, path) {
  try {
    return parse(url).pathname === path;
  } catch (e) {
    return false;
  }
}

exports.createMemoizedToJson = function() {
  var lastStats = null;
  var lastJson = null;
  return function(stats) {
    if (lastStats !== stats) {
      lastStats = stats;
      lastJson = stats.toJson({ errorDetails: false });
    }
    return lastJson;
  }
};
