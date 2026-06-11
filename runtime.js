const runtime = window.location.protocol === 'chrome-extension:' ? 'extension' : 'web';
document.documentElement.dataset.runtime = runtime;
document.documentElement.classList.add('js');
