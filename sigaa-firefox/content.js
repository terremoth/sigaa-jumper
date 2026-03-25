// content.js - Firefox (Manifest V2, compatível com mobile)

const LOGIN_URL = 'https://sigaa.ifsc.edu.br/sigaa/verTelaLogin.do';
const WARNING_URL = 'https://sigaa.ifsc.edu.br/sigaa/telaAvisoLogon.jsf';
const MAX_ERROR_RETRIES = 3;

const currentUrl = window.location.href;

// Compatibilidade Chrome/Firefox
const _browser = typeof browser !== 'undefined' ? browser : chrome;

function showBadge(msg, color) {
  color = color || '#1a6b3c';
  let badge = document.getElementById('sigaa-autologin-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'sigaa-autologin-badge';
    // Estilo otimizado para mobile também
    badge.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:10px',
      'z-index:2147483647',
      'color:white',
      'font-family:system-ui,sans-serif',
      'font-size:14px',
      'font-weight:700',
      'padding:10px 16px',
      'border-radius:10px',
      'box-shadow:0 3px 14px rgba(0,0,0,0.3)',
      'display:flex',
      'align-items:center',
      'gap:8px',
      'max-width:290px',
      'line-height:1.4',
      'word-break:break-word',
    ].join(';');
    document.body.appendChild(badge);
  }
  badge.style.background = color;
  badge.innerHTML = '<span style="font-size:18px;flex-shrink:0">⚡</span><span>' + msg + '</span>';
}

// Lida com o captcha do Cloudflare
function isTurnstileSolved() {
  var input = document.querySelector(
    'input[name="cf-turnstile-response"], textarea[name="cf-turnstile-response"]'
  );
  if (input && input.value) return true;

  var el = document.querySelector('[data-turnstile-response]');
  if (el && el.getAttribute('data-turnstile-response')) return true;

  return false;
}

function hasTurnstileWidget() {
  return !!document.querySelector(
    '.cf-turnstile, [data-sitekey], iframe[src*="challenges.cloudflare.com"]'
  );
}

function waitForTurnstile(timeoutSeconds) {
  return new Promise(function(resolve) {
    if (!hasTurnstileWidget()) {
      resolve('no-captcha');
      return;
    }

    if (isTurnstileSolved()) {
      resolve('solved');
      return;
    }

    var deadline = Date.now() + (timeoutSeconds * 1000);
    var remaining = timeoutSeconds;
    showBadge('Aguardando captcha... ' + remaining + 's');

    var interval = setInterval(function() {
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

      showBadge('Aguardando captcha... ' + remaining + 's');
    }, 1000);
  });
}

function handleLoginPage(creds) {
  const form = document.getElementById('loginForm') || document.forms['loginForm'];
  if (!form) return;

  const userField = form.elements['user.login'];
  const passField = form.elements['user.senha'];

  if (!userField || !passField) return;

  if (!creds.user || !creds.pass) {
    showBadge('⚠️ Configure usuário e senha na extensão!', '#c0392b');
    return;
  }

  // Preenche os campos
  userField.value = creds.user;
  passField.value = creds.pass;

  // Dispara eventos de input para o framework do site reconhecer
  ['input', 'change', 'keyup'].forEach(function(evt) {
    userField.dispatchEvent(new Event(evt, { bubbles: true }));
    passField.dispatchEvent(new Event(evt, { bubbles: true }));
  });

  sessionStorage.removeItem('sigaa_autologin_retries');

  waitForTurnstile(creds.delay || 30).then(function(result) {
    if (result === 'solved') {
      showBadge('✅ Captcha resolvido! Fazendo login...');
    } else if (result === 'no-captcha') {
      showBadge('Fazendo login...');
    } else {
      showBadge('⏱️ Timeout — tentando login...', '#e67e22');
    }
    setTimeout(function() { form.submit(); }, 500);
  });
}

// Lida com a página de erro
function handleErrorPage() {
  var panel = document.querySelector('#painel-erro');
  if (!panel || panel.textContent.indexOf('Comportamento Inesperado') === -1) return false;

  var retries = parseInt(sessionStorage.getItem('sigaa_autologin_retries') || '0');

  if (retries >= MAX_ERROR_RETRIES) {
    showBadge('❌ Falhou ' + MAX_ERROR_RETRIES + 'x — login manual necessário', '#c0392b');
    sessionStorage.removeItem('sigaa_autologin_retries');
    return true;
  }

  sessionStorage.setItem('sigaa_autologin_retries', String(retries + 1));
  showBadge(
    '⚠️ Erro detectado — tentando novamente (' + (retries + 1) + '/' + MAX_ERROR_RETRIES + ')...',
    '#e67e22'
  );

  setTimeout(function() {
    window.location.href = LOGIN_URL;
  }, 1500);

  return true;
}

// Faz o redirecionamento para a página de login
function handlePublicHomePage() {
  var link = document.querySelector('#acesso a[href="/sigaa/"]');
  if (!link) return false;

  showBadge('Redirecionando para login...');
  setTimeout(function() { link.click(); }, 300);
  return true;
}

function handleWarningPage(skipWarnings) {
  if (!skipWarnings) return;

  // Busca botão "Continuar >>" em qualquer form da página
  var forms = document.querySelectorAll('form');
  var continueBtn = null;

  for (var i = 0; i < forms.length; i++) {
    var btns = forms[i].querySelectorAll('input[type="submit"], button[type="submit"], button');
    for (var j = 0; j < btns.length; j++) {
      var val = (btns[j].value || btns[j].textContent || '').trim().toLowerCase();
      if (val.indexOf('continuar') !== -1) {
        continueBtn = btns[j];
        break;
      }
    }
    if (continueBtn) break;
  }

  if (continueBtn) {
    showBadge('Pulando tela de aviso...');
    setTimeout(function() {
      continueBtn.click();
    }, 300);
  } else {
    var allBtns = document.querySelectorAll('input[type="submit"], button[type="submit"]');
    if (allBtns.length === 1) {
      showBadge('Pulando aviso (fallback)...');
      setTimeout(function() { allBtns[0].click(); }, 300);
    } else {
      showBadge('Tela de aviso — botão não encontrado', '#e67e22');
    }
  }
}

function init() {
  _browser.runtime.sendMessage({ type: 'GET_CREDENTIALS' }).then(function(creds) {
    if (!creds) return;
    if (currentUrl.startsWith(LOGIN_URL)) {
      handleLoginPage(creds);
    } else if (currentUrl.startsWith(WARNING_URL)) {
      handleWarningPage(creds.skipWarnings);
    } else if (handlePublicHomePage()) {
      // handled
    } else if (handleErrorPage()) {
      // handled
    }
  }).catch(function(err) {
    console.warn('[SIGAA AutoLogin] Erro ao buscar credenciais:', err);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
