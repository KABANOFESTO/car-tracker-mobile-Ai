const { listIncidents } = require('../services/incident.service');
const { runDispatcherCycle } = require('../services/dispatcher.service');
const { writeAuditLog } = require('../services/audit-log.service');

async function listIncidentsController(request, response) {
  const incidents = await listIncidents();
  response.json({ incidents });
}

async function runDispatcherController(request, response) {
  const result = await runDispatcherCycle();
  await writeAuditLog({
    actorUserId: request.user._id.toString(),
    actorEmail: request.user.email,
    action: 'dispatcher.run',
    targetType: 'dispatcher',
    targetId: 'primary',
    ip: request.ip,
    metadata: result,
  });
  response.json(result);
}

module.exports = { listIncidentsController, runDispatcherController };
