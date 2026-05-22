const AuditLog = require('../models/AuditLog');

async function writeAuditLog(entry) {
  try {
    await AuditLog.create(entry);
  } catch (error) {
    console.error('[audit-log]', error.message);
  }
}

async function listAuditLogs({ page = 1, limit = 50, action, actorUserId, targetType } = {}) {
  const query = {};
  if (action) query.action = { $regex: action, $options: 'i' };
  if (actorUserId) query.actorUserId = actorUserId;
  if (targetType) query.targetType = targetType;

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const [items, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

module.exports = { writeAuditLog, listAuditLogs };
