exports.pathMatch = pathMatch;
exports.detectConstDependency = detectConstDependency;

function pathMatch(url, path) {
  if (url == path) return true;
  var q = url.indexOf('?');
  if (q == -1) return false;
  return url.substring(0, q) == path;
}

function detectConstDependency(compilation) {
  var dependencyFactories = compilation.dependencyFactories;
  for (var i = 0, len = dependencyFactories.keys.length; i < len; i++) {
    var key = dependencyFactories.keys[i];
    if (typeof key == "function" && key.name == "ConstDependency") {
      return key;
    }
  }
}
