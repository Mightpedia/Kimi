module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-key',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '30d',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  SERPAPI_KEY: process.env.SERPAPI_KEY,
  SITE_URL: process.env.SITE_URL || 'http://localhost:3000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};