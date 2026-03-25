// background.js - Firefox (Manifest V2)

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'GET_CREDENTIALS') {
    return browser.storage.local.get(['sigaa_user', 'sigaa_pass', 'sigaa_delay', 'sigaa_skip_warnings'])
      .then(data => ({
        user: data.sigaa_user || '',
        pass: data.sigaa_pass ? atob(data.sigaa_pass) : '',
        delay: data.sigaa_delay !== undefined ? data.sigaa_delay : 7,
        skipWarnings: data.sigaa_skip_warnings !== undefined ? data.sigaa_skip_warnings : true
      }));
  }
});
