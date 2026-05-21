const { listIncidents } = require('../services/incident.service');
const { runDispatcherCycle } = require('../services/dispatcher.service');

async function listIncidentsController(request, response) {
  const incidents = await listIncidents();
  response.json({ incidents });
}

async function runDispatcherController(request, response) {
  const result = await runDispatcherCycle();
  response.json(result);
}

module.exports = { listIncidentsController, runDispatcherController };
