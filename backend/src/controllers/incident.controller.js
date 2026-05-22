const { listIncidents, acknowledgeIncident } = require('../services/incident.service');
const { runDispatcherCycle } = require('../services/dispatcher.service');
const { writeAuditLog } = require('../services/audit-log.service');

async function listIncidentsController(request, response) {
  const result = await listIncidents(request.user, request.query || {});
  response.json({ ok: true, ...result });
}

async function acknowledgeIncidentController(request, response) {
  const incident = await acknowledgeIncident(request.user, request.params.incidentId);
  await writeAuditLog({
    actorUserId: request.user._id.toString(),
    actorEmail: request.user.email,
    action: 'incident.acknowledge',
    targetType: 'incident',
    targetId: incident.incidentKey,
    ip: request.ip,
    metadata: { ownerUserId: incident.ownerUserId },
  });
  response.json({ ok: true, incident });
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

module.exports = { listIncidentsController, acknowledgeIncidentController, runDispatcherController };
