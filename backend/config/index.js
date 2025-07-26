// Backend configuration
export const config = {
  PORT: process.env.DATABRICKS_APP_PORT || 3000,
  HOST: '0.0.0.0',
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzBIli3dtEranTVoDyoI_Ufvx5YCKk4HbIBOAbfeT-QVk5Njg85WzJwqHQsGwLXstm6/exec',
  PERPLEXITY_API_KEY: process.env.VITE_PERPLEXITY_API_KEY || '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',
  PERPLEXITY_API_URL: process.env.VITE_PERPLEXITY_API_URL || 'https://api.perplexity.ai/chat/completions'
};