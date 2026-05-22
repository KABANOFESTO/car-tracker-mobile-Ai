const { listRequestLogs } = require('../services/request-log.service');
const { listAuditLogs } = require('../services/audit-log.service');
const { listErrorLogs } = require('../services/error-log.service');

async function listRequestLogsController(request, response) {
  const result = await listRequestLogs(request.query || {});
  response.json({ ok: true, ...result });
}

async function listAuditLogsController(request, response) {
  const result = await listAuditLogs(request.query || {});
  response.json({ ok: true, ...result });
}

async function listErrorLogsController(request, response) {
  const result = await listErrorLogs(request.query || {});
  response.json({ ok: true, ...result });
}

module.exports = { listRequestLogsController, listAuditLogsController, listErrorLogsController };
