/*eslint-env browser*/

var clientOverlay = document.createElement('div');
clientOverlay.style.display = 'none';
clientOverlay.style.background = '#fdd';
clientOverlay.style.color = '#000';
clientOverlay.style.whiteSpace = 'pre';
clientOverlay.style.fontFamily = 'monospace';
clientOverlay.style.position = 'fixed';
clientOverlay.style.zIndex = 9999;
clientOverlay.style.padding = '10px';
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
    var div = document.createElement('div');
    div.textContent = msg;
    clientOverlay.appendChild(div);
  });
};

exports.clear =
function clear() {
  clientOverlay.innerHTML = '';
  clientOverlay.style.display = 'none';
};

