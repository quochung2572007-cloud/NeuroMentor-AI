const localHosts = new Set(['localhost', '127.0.0.1']);
const localApiRoot = 'http://localhost:8000/v1';
const productionApiRoot = 'https://neurommentor-api-khaivan2210.onrender.com/v1';

globalThis.NEUROMENTOR_CONFIG = Object.freeze({
  apiRoot: localHosts.has(globalThis.location?.hostname) ? localApiRoot : productionApiRoot,
});

