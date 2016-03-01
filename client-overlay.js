/*eslint-env browser*/

var clientOverlay = document.createElement('div');
var styles = {
  display: 'none',
  background: 'rgba(0,0,0,0.85)',
  color: '#E8E8E8',
  lineHeight: '1.2rem',
  whiteSpace: 'pre',
  fontFamily: 'Menlo, Consolas, monospace',
  fontSize: '13px',
  position: 'fixed',
  zIndex: 9999,
  padding: '10px',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  overflow: 'auto'
};
for (var key in styles) {
  clientOverlay.style[key] = styles[key];
}

if (document.body) {
  document.body.appendChild(clientOverlay);
}

var ansiHTML = require('ansi-html');
var colors = {
  reset: ['transparent', 'transparent'],
  black: '181818',
  red: 'E36049',
  green: 'B3CB74',
  yellow: 'FFD080',
  blue: '7CAFC2',
  magenta: '7FACCA',
  cyan: 'C3C2EF',
  lightgrey: 'EBE7E3',
  darkgrey: '6D7891'
};
ansiHTML.setColors(colors);

exports.showProblems =
function showProblems(type, lines) {
  clientOverlay.innerHTML = '';
  clientOverlay.style.display = 'block';
  lines.forEach(function(msg) {
    var div = document.createElement('div');
    div.style.marginBottom = '2rem';
    div.innerHTML = problemType(type) + ' in ' + ansiHTML(msg);
    clientOverlay.appendChild(div);
  });
};

exports.clear =
function clear() {
  clientOverlay.innerHTML = '';
  clientOverlay.style.display = 'none';
};

var problemColors = {
  errors: colors.red,
  warnings: colors.yellow
};

function problemType (type) {
  var color = problemColors[type] || colors.red;
  return (
    '<span style="background-color:#' + color + '; color:#fff; padding:2px 4px; border-radius: 2px">' +
      type.slice(0, -1).toUpperCase() +
    '</span>'
  );
}
