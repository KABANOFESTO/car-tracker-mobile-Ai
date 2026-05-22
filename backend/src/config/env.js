const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI,
  corsOrigins: String(process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  mobileApiKey: process.env.MOBILE_API_KEY,
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminName: process.env.ADMIN_NAME || 'Fleet Admin',
  thingspeakBaseUrl: process.env.THINGSPEAK_BASE_URL || 'https://api.thingspeak.com',
  dispatcherPollIntervalMs: Number(process.env.DISPATCHER_POLL_INTERVAL_MS || 30000),
  expoPushApiUrl: process.env.EXPO_PUSH_API_URL || 'https://exp.host/--/api/v2/push/send',
  passwordResetTokenTtlMinutes: Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30),
  logRetentionDays: Number(process.env.LOG_RETENTION_DAYS || 30),
};

if (!env.mongoUri) {
  throw new Error('MONGO_URI is required in backend/.env');
}

if (!env.mobileApiKey) {
  throw new Error('MOBILE_API_KEY is required in backend/.env');
}

if (!env.jwtSecret) {
  throw new Error('JWT_SECRET is required in backend/.env');
}

if (!env.adminEmail || !env.adminPassword) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in backend/.env');
}

module.exports = env;
