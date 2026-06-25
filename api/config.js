const DEFAULT_API_ROOT = 'https://neurommentor-api-khaivan2210.onrender.com/v1';

function normalizeSupabaseUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

module.exports = function handler(_request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || '').trim();

  response.status(200).json({
    apiRoot: process.env.NEUROMENTOR_API_ROOT || process.env.API_ROOT || DEFAULT_API_ROOT,
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    },
    authProvider: supabaseUrl && supabaseAnonKey
      ? 'supabase'
      : 'unconfigured',
  });
};
