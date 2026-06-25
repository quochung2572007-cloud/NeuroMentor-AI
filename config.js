const localHosts = new Set(['localhost', '127.0.0.1']);
const currentHost = globalThis.location?.hostname;
const localApiHost = currentHost === '127.0.0.1' ? '127.0.0.1' : 'localhost';
const localApiRoot = `http://${localApiHost}:8000/v1`;
const productionApiRoot = 'https://neurommentor-api-khaivan2210.onrender.com/v1';

globalThis.NEUROMENTOR_CONFIG = Object.freeze({
  apiRoot: localHosts.has(currentHost) ? localApiRoot : productionApiRoot,
  supabase: {
    // Project Settings > API. Use the public anon key only, never the service_role key.
    url: '',
    anonKey: '',
  },
});
