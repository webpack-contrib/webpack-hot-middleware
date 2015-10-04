/*eslint-env browser*/

var clientOverlay = document.createElement('div');
clientOverlay.style.display = 'none';
clientOverlay.style.background = '#fdd';
clientOverlay.style.color = '#000';
clientOverlay.style.position = 'fixed';
clientOverlay.style.zIndex = 9999;
clientOverlay.style.left = 0;
clientOverlay.style.right = 0;
clientOverlay.style.top = 0;
clientOverlay.style.bottom = 0;
clientOverlay.style.overflow = 'auto';

if (document.body) {
  document.body.appendChild(clientOverlay);
}

exports.showProblems =
function showProblems(lines) {
  clientOverlay.innerHTML = '';
  clientOverlay.style.display = 'block';
  lines.forEach(function(msg) {
    var pre = document.createElement('pre');
    pre.textContent = msg;
    clientOverlay.appendChild(pre);
  });
};

exports.clear =
function clear() {
  clientOverlay.innerHTML = '';
  clientOverlay.style.display = 'none';
};

