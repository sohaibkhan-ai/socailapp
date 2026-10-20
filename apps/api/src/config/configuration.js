module.exports = () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:19006')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  throttle: {
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
  },
  upload: {
    maxMb: parseInt(process.env.MAX_UPLOAD_MB || '5', 10),
    dir: process.env.UPLOAD_DIR || 'uploads',
  },
});
