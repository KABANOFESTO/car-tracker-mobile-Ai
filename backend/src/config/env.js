const path = require('path');
const dotenv = require('dotenv');

// __dirname may be undefined in some module environments; derive a base directory
// from the main module (fallback to process.cwd()) and resolve the .env path
const baseDir = path.dirname(require.main && require.main.filename ? require.main.filename : process.cwd());
dotenv.config({ path: path.resolve(baseDir, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI,
  mobileApiKey: process.env.MOBILE_API_KEY,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminName: process.env.ADMIN_NAME || 'Fleet Admin',
  thingspeakBaseUrl: process.env.THINGSPEAK_BASE_URL || 'https://api.thingspeak.com',
  dispatcherPollIntervalMs: Number(process.env.DISPATCHER_POLL_INTERVAL_MS || 30000),
  expoPushApiUrl: process.env.EXPO_PUSH_API_URL || 'https://exp.host/--/api/v2/push/send',
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
