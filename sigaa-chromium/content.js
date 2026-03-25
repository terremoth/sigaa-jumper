// content.js - Executado em todas as páginas do SIGAA

const LOGIN_URL = 'https://sigaa.ifsc.edu.br/sigaa/verTelaLogin.do';
const WARNING_URL = 'https://sigaa.ifsc.edu.br/sigaa/telaAvisoLogon.jsf';
const HOME_URL = 'https://sigaa.ifsc.edu.br/sigaa/portais/discente/discente.jsf';

const currentUrl = window.location.href;

// Injeta badge visual de status
function showBadge(msg, color = '#1a6b3c') {
  let badge = document.getElementById('sigaa-autologin-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'sigaa-autologin-badge';
    badge.style.cssText = `
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 999999;
      background: ${color};
      color: white;
      font-family: sans-serif;
      font-size: 13px;
      font-weight: bold;
      padding: 8px 14px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 280px;
      line-height: 1.4;
    `;
    document.body.appendChild(badge);
  }
  badge.style.background = color;
  badge.innerHTML = `<span style="font-size:16px">⚡</span> <span>${msg}</span>`;
}

function hideBadge() {
  const badge = document.getElementById('sigaa-autologin-badge');
  if (badge) badge.remove();
}

// Página de login
function handleLoginPage(creds) {
  const form = document.getElementById('loginForm') || document.forms['loginForm'];
  if (!form) return;

  const userField = form.elements['user.login'];
  const passField = form.elements['user.senha'];

  if (!userField || !passField) return;
  if (!creds.user || !creds.pass) {
    showBadge('⚠️ Configure seu usuário e senha na extensão!', '#c0392b');
    return;
  }

  // Preenche os campos
  userField.value = creds.user;
  passField.value = creds.pass;

  // Dispara eventos para o site reconhecer o preenchimento
  ['input', 'change', 'keyup'].forEach(evt => {
    userField.dispatchEvent(new Event(evt, { bubbles: true }));
    passField.dispatchEvent(new Event(evt, { bubbles: true }));
  });

  const delay = (creds.delay || 7) * 1000;
  showBadge(`Login automático em ${creds.delay || 7}s... aguardando captcha`);

  let remaining = creds.delay || 7;
  const interval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      showBadge(`Enviando em ${remaining}s... aguardando captcha`);
    } else {
      clearInterval(interval);
      showBadge('Fazendo login...');
      form.submit();
    }
  }, 1000);
}

// Página de aviso (telaAvisoLogon.jsf)
function handleWarningPage(skipWarnings) {
  if (!skipWarnings) return;

  // Encontra o botão "Continuar >>" pelo value, independente de name/id
  const forms = document.querySelectorAll('form');
  let continueBtn = null;

  for (const f of forms) {
    const btns = f.querySelectorAll('input[type="submit"], button[type="submit"]');
    for (const btn of btns) {
      const val = (btn.value || btn.textContent || '').trim();
      if (val.toLowerCase().includes('continuar')) {
        continueBtn = btn;
        break;
      }
    }
    if (continueBtn) break;
  }

  if (continueBtn) {
    showBadge('Pulando tela de aviso...');
    setTimeout(() => {
      continueBtn.click();
    }, 300);
  } else {
    showBadge('Tela de aviso — botão não encontrado', '#e67e22');
  }
}

// Inicialização
function init() {
  chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' }, (creds) => {
    if (chrome.runtime.lastError || !creds) return;

    if (currentUrl.startsWith(LOGIN_URL)) {
      handleLoginPage(creds);
    } else if (currentUrl.startsWith(WARNING_URL)) {
      handleWarningPage(creds.skipWarnings);
    }
    // Em outras páginas não faz nada
  });
}

// Aguarda o DOM estar pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
