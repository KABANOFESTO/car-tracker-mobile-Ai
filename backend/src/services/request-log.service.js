const RequestLog = require('../models/RequestLog');

async function writeRequestLog(entry) {
  try {
    await RequestLog.create(entry);
  } catch (error) {
    console.error('[request-log]', error.message);
  }
}

async function listRequestLogs({ page = 1, limit = 50, severity, path, statusCode } = {}) {
  const query = {};
  if (severity) query.severity = severity;
  if (path) query.path = { $regex: path, $options: 'i' };
  if (statusCode) query.statusCode = Number(statusCode);

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const [items, total] = await Promise.all([
    RequestLog.find(query).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    RequestLog.countDocuments(query),
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

module.exports = { writeRequestLog, listRequestLogs };
