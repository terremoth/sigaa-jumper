var _b = typeof browser !== 'undefined' ? browser : chrome;

function $id(id) { return document.getElementById(id); }

// Carrega configurações
_b.storage.local.get(['sigaa_user', 'sigaa_pass', 'sigaa_delay', 'sigaa_skip_warnings']).then(function(data) {
  if (data.sigaa_user) $id('username').value = data.sigaa_user;
  if (data.sigaa_pass) $id('password').value = atob(data.sigaa_pass);
  if (data.sigaa_delay !== undefined) $id('delay').value = data.sigaa_delay;
  if (data.sigaa_skip_warnings !== undefined) $id('skipWarnings').checked = data.sigaa_skip_warnings;
});

// Toggle senha
$id('togglePass').addEventListener('click', function() {
  var inp = $id('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  $id('togglePass').textContent = inp.type === 'password' ? '👁️' : '🙈';
});

// Salvar
$id('saveBtn').addEventListener('click', function() {
  var user = $id('username').value.trim();
  var pass = $id('password').value;
  var delay = parseInt($id('delay').value) || 7;
  var skipWarnings = $id('skipWarnings').checked;

  if (!user || !pass) {
    showToast('Preencha usuário e senha!', 'error');
    return;
  }

  if (delay < 3 || delay > 60) {
    showToast('Tempo deve ser entre 3 e 60 segundos.', 'error');
    return;
  }

  _b.storage.local.set({
    sigaa_user: user,
    sigaa_pass: btoa(pass),
    sigaa_delay: delay,
    sigaa_skip_warnings: skipWarnings
  }).then(function() {
    showToast('✅ Configurações salvas!', 'success');
  });
});

function showToast(msg, type) {
  var t = $id('toast');
  t.className = 'toast ' + type;
  t.textContent = msg;
  setTimeout(function() { t.className = 'toast'; }, 3500);
}
