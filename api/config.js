const DEFAULT_API_ROOT = 'https://neurommentor-api-khaivan2210.onrender.com/v1';

module.exports = function handler(_request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  response.status(200).json({
    apiRoot: process.env.NEUROMENTOR_API_ROOT || process.env.API_ROOT || DEFAULT_API_ROOT,
    supabase: {
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
    },
    authProvider: process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
      ? 'supabase'
      : 'unconfigured',
  });
};
