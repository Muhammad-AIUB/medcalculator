export default () => ({
  port: parseInt(process.env.PORT ?? '5000', 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5001'],
  },
  throttle: {
    // Short burst window (per IP) — absorbs spiky bursts.
    short: {
      ttl: parseInt(process.env.THROTTLE_SHORT_TTL ?? '1000', 10) || 1000,
      limit: parseInt(process.env.THROTTLE_SHORT_LIMIT ?? '50', 10) || 50,
    },
    // Sustained window (per IP) — caps long-running abuse.
    medium: {
      ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10) || 60000,
      limit: parseInt(process.env.THROTTLE_LIMIT ?? '1000', 10) || 1000,
    },
  },
});
