const REQUIRED = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

function validateEnv(config) {
  const missing = REQUIRED.filter((k) => !config[k] && !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  const warnings = [];
  if (!config.JWT_ACCESS_SECRET || config.JWT_ACCESS_SECRET.length < 32) {
    warnings.push('JWT_ACCESS_SECRET should be at least 32 chars in production');
  }
  for (const w of warnings) console.warn(`[env] ${w}`);
  return config;
}

module.exports = { validateEnv };
