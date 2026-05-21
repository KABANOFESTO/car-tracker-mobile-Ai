const { listRequestLogs } = require('../services/request-log.service');
const { listAuditLogs } = require('../services/audit-log.service');

async function listRequestLogsController(request, response) {
  const logs = await listRequestLogs();
  response.json({ ok: true, logs });
}

async function listAuditLogsController(request, response) {
  const logs = await listAuditLogs();
  response.json({ ok: true, logs });
}

module.exports = { listRequestLogsController, listAuditLogsController };
