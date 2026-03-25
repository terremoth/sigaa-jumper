// Carrega configurações salvas
chrome.storage.local.get(['sigaa_user', 'sigaa_pass', 'sigaa_delay', 'sigaa_skip_warnings'], function(data) {
  if (data.sigaa_user) document.getElementById('username').value = data.sigaa_user;
  if (data.sigaa_pass) document.getElementById('password').value = atob(data.sigaa_pass);
  if (data.sigaa_delay !== undefined) document.getElementById('delay').value = data.sigaa_delay;
  if (data.sigaa_skip_warnings !== undefined) document.getElementById('skipWarnings').checked = data.sigaa_skip_warnings;
});

// Toggle senha visível
document.getElementById('togglePass').addEventListener('click', function() {
  var input = document.getElementById('password');
  input.type = input.type === 'password' ? 'text' : 'password';
  document.getElementById('togglePass').textContent = input.type === 'password' ? '👁️' : '🙈';
});

// Salvar
document.getElementById('saveBtn').addEventListener('click', function() {
  var user = document.getElementById('username').value.trim();
  var pass = document.getElementById('password').value;
  var delay = parseInt(document.getElementById('delay').value) || 7;
  var skipWarnings = document.getElementById('skipWarnings').checked;

  if (!user || !pass) {
    showToast('Preencha usuário e senha!', 'error');
    return;
  }

  if (delay < 3 || delay > 60) {
    showToast('Tempo deve ser entre 3 e 60 segundos.', 'error');
    return;
  }

  chrome.storage.local.set({
    sigaa_user: user,
    sigaa_pass: btoa(pass),
    sigaa_delay: delay,
    sigaa_skip_warnings: skipWarnings
  }, function() {
    showToast('✅ Configurações salvas com sucesso!', 'success');
  });
});

function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.className = 'toast ' + type;
  t.textContent = msg;
  setTimeout(function() { t.className = 'toast'; }, 3500);
}
