const RequestLog = require('../models/RequestLog');

async function writeRequestLog(entry) {
  try {
    await RequestLog.create(entry);
  } catch (error) {
    console.error('[request-log]', error.message);
  }
}

async function listRequestLogs(limit = 200) {
  return RequestLog.find().sort({ createdAt: -1 }).limit(limit).lean();
}

module.exports = { writeRequestLog, listRequestLogs };
