// background.js - Service Worker (Manifest V3)

// Escuta mensagens do content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CREDENTIALS') {
    chrome.storage.local.get(['sigaa_user', 'sigaa_pass', 'sigaa_delay', 'sigaa_skip_warnings'], (data) => {
      sendResponse({
        user: data.sigaa_user || '',
        pass: data.sigaa_pass ? atob(data.sigaa_pass) : '',
        delay: data.sigaa_delay !== undefined ? data.sigaa_delay : 7,
        skipWarnings: data.sigaa_skip_warnings !== undefined ? data.sigaa_skip_warnings : true
      });
    });
    return true; // async
  }
});
