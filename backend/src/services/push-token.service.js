const PushToken = require('../models/PushToken');

async function registerPushToken(payload) {
  if (!payload.token) {
    throw new Error('Push token is required');
  }

  const token = await PushToken.findOneAndUpdate(
    { token: payload.token },
    {
      $set: {
        platform: payload.platform || 'unknown',
        projectId: payload.projectId || null,
        registeredAt: payload.registeredAt ? new Date(payload.registeredAt) : new Date(),
        lastSeenAt: new Date(),
        active: true,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return token;
}

async function listActivePushTokens() {
  return PushToken.find({ active: true }).lean();
}

module.exports = { registerPushToken, listActivePushTokens };
