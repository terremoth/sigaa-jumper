var _b = typeof browser !== 'undefined' ? browser : chrome;

_b.storage.local.get(['sigaa_user', 'sigaa_pass']).then(function(data) {
  var dot = document.getElementById('dot');
  var txt = document.getElementById('statusText');
  if (data.sigaa_user && data.sigaa_pass) {
    dot.className = 'dot ok';
    txt.textContent = 'Pronto — ' + data.sigaa_user;
  } else {
    dot.className = 'dot warn';
    txt.textContent = 'Configure usuário e senha';
  }
});

document.getElementById('btnOpts').addEventListener('click', function() {
  _b.runtime.openOptionsPage();
});
