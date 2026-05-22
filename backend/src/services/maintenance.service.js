const env = require('../config/env');
const RequestLog = require('../models/RequestLog');
const AuditLog = require('../models/AuditLog');
const ErrorLog = require('../models/ErrorLog');
const RefreshToken = require('../models/RefreshToken');
const PasswordResetToken = require('../models/PasswordResetToken');

async function purgeExpiredRecords() {
  const retentionThreshold = new Date(Date.now() - env.logRetentionDays * 24 * 60 * 60 * 1000);
  await Promise.all([
    RequestLog.deleteMany({ createdAt: { $lt: retentionThreshold } }),
    AuditLog.deleteMany({ createdAt: { $lt: retentionThreshold } }),
    ErrorLog.deleteMany({ createdAt: { $lt: retentionThreshold } }),
    RefreshToken.deleteMany({
      $or: [{ expiresAt: { $lt: new Date() } }, { revokedAt: { $ne: null }, createdAt: { $lt: retentionThreshold } }],
    }),
    PasswordResetToken.deleteMany({
      $or: [{ expiresAt: { $lt: new Date() } }, { usedAt: { $ne: null }, createdAt: { $lt: retentionThreshold } }],
    }),
  ]);
}

module.exports = { purgeExpiredRecords };
