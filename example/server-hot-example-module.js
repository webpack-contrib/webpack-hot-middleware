var i = 1;
exports.api = {};

if (module.hot && module.hot.data) {
  exports.api = module.hot.data.api;
  i = module.hot.data.i || 1;
}

exports.api.fn = function() {
  return 'I am very hot: ' + i++;
}

if (module.hot) {
  module.hot.accept();
  
  module.hot.dispose(function(data) {
    data.i = i;
    data.api = exports.api;
  });
}