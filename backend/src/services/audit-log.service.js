const AuditLog = require('../models/AuditLog');

async function writeAuditLog(entry) {
  try {
    await AuditLog.create(entry);
  } catch (error) {
    console.error('[audit-log]', error.message);
  }
}

async function listAuditLogs(limit = 200) {
  return AuditLog.find().sort({ createdAt: -1 }).limit(limit).lean();
}

module.exports = { writeAuditLog, listAuditLogs };
