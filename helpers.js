var parse = require('url').parse;

exports.pathMatch = function (url, path) {
  try {
    if (typeof URL === 'function') return new URL(url).pathname === path;
    return parse(url).pathname === path;
  } catch (e) {
    return false;
  }
};
