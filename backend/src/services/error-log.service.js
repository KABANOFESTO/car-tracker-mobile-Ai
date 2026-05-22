const ErrorLog = require('../models/ErrorLog');

async function writeErrorLog(entry) {
  try {
    await ErrorLog.create(entry);
  } catch (error) {
    console.error('[error-log]', error.message);
  }
}

async function listErrorLogs({ page = 1, limit = 50, severity, source } = {}) {
  const query = {};
  if (severity) query.severity = severity;
  if (source) query.source = source;

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const [items, total] = await Promise.all([
    ErrorLog.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    ErrorLog.countDocuments(query),
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

module.exports = { writeErrorLog, listErrorLogs };
