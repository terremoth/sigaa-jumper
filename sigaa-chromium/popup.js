chrome.storage.local.get(['sigaa_user', 'sigaa_pass'], function(data) {
  var dot = document.getElementById('statusDot');
  var txt = document.getElementById('statusText');
  if (data.sigaa_user && data.sigaa_pass) {
    dot.className = 'status-dot ok';
    txt.textContent = 'Pronto — usuário: ' + data.sigaa_user;
  } else {
    dot.className = 'status-dot warn';
    txt.textContent = 'Configure usuário e senha';
  }
});

document.getElementById('openOptions').addEventListener('click', function() {
  chrome.runtime.openOptionsPage();
});
