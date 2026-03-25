// content.js - Executado em todas as páginas do SIGAA

const LOGIN_URL = 'https://sigaa.ifsc.edu.br/sigaa/verTelaLogin.do';
const WARNING_URL = 'https://sigaa.ifsc.edu.br/sigaa/telaAvisoLogon.jsf';
const MAX_ERROR_RETRIES = 3;

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

// Lida com o captcha do Cloudflare
function isTurnstileSolved() {
  const input = document.querySelector(
    'input[name="cf-turnstile-response"], textarea[name="cf-turnstile-response"]'
  );
  if (input && input.value) return true;

  const el = document.querySelector('[data-turnstile-response]');
  if (el && el.getAttribute('data-turnstile-response')) return true;

  return false;
}

function hasTurnstileWidget() {
  return !!document.querySelector(
    '.cf-turnstile, [data-sitekey], iframe[src*="challenges.cloudflare.com"]'
  );
}

function waitForTurnstile(timeoutSeconds) {
  return new Promise((resolve) => {
    if (!hasTurnstileWidget()) {
      resolve('no-captcha');
      return;
    }

    if (isTurnstileSolved()) {
      resolve('solved');
      return;
    }

    const deadline = Date.now() + (timeoutSeconds * 1000);
    let remaining = timeoutSeconds;
    showBadge(`Aguardando captcha... ${remaining}s`);

    const interval = setInterval(() => {
      remaining--;

      if (isTurnstileSolved()) {
        clearInterval(interval);
        resolve('solved');
        return;
      }

      if (Date.now() >= deadline) {
        clearInterval(interval);
        resolve('timeout');
        return;
      }

      showBadge(`Aguardando captcha... ${remaining}s`);
    }, 1000);
  });
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

  sessionStorage.removeItem('sigaa_autologin_retries');

  waitForTurnstile(creds.delay || 30).then((result) => {
    if (result === 'solved') {
      showBadge('✅ Captcha resolvido! Fazendo login...');
    } else if (result === 'no-captcha') {
      showBadge('Fazendo login...');
    } else {
      showBadge('⏱️ Timeout — tentando login...', '#e67e22');
    }
    setTimeout(() => form.submit(), 500);
  });
}

// Lida com a página de erro
function handleErrorPage() {
  const panel = document.querySelector('#painel-erro');
  if (!panel || !panel.textContent.includes('Comportamento Inesperado')) return false;

  const retries = parseInt(sessionStorage.getItem('sigaa_autologin_retries') || '0');

  if (retries >= MAX_ERROR_RETRIES) {
    showBadge(`❌ Falhou ${MAX_ERROR_RETRIES}x — login manual necessário`, '#c0392b');
    sessionStorage.removeItem('sigaa_autologin_retries');
    return true;
  }

  sessionStorage.setItem('sigaa_autologin_retries', String(retries + 1));
  showBadge(
    `⚠️ Erro detectado — tentando novamente (${retries + 1}/${MAX_ERROR_RETRIES})...`,
    '#e67e22'
  );

  setTimeout(() => {
    window.location.href = LOGIN_URL;
  }, 1500);

  return true;
}

// Faz o redirecionamento para a página de login
function handlePublicHomePage() {
  const link = document.querySelector('#acesso a[href="/sigaa/"]');
  if (!link) return false;

  showBadge('Redirecionando para login...');
  setTimeout(() => link.click(), 300);
  return true;
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
    const allBtns = document.querySelectorAll('input[type="submit"], button[type="submit"]');
    if (allBtns.length === 1) {
      showBadge('Pulando aviso (fallback)...');
      setTimeout(() => allBtns[0].click(), 300);
    } else {
      showBadge('Tela de aviso — botão não encontrado', '#e67e22');
    }
  }
}

// Inicialização
function init() {
  chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' }).then((creds) => {
    if (chrome.runtime.lastError || !creds) return;

    if (currentUrl.startsWith(LOGIN_URL)) {
      handleLoginPage(creds);
    } else if (currentUrl.startsWith(WARNING_URL)) {
      handleWarningPage(creds.skipWarnings);
    } else if (handlePublicHomePage()) {
      // handled
    } else if (handleErrorPage()) {
      // handled
    }
    // Em outras páginas não faz nada
  }).catch((err) => {
    console.warn('[SIGAA AutoLogin] Erro ao buscar credenciais:', err);
  });
}

// Aguarda o DOM estar pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
