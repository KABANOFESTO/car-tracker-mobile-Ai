const { syncFleetState } = require('../services/state.service');
const { registerPushToken } = require('../services/push-token.service');

async function syncStateController(request, response) {
  const state = await syncFleetState(request.body || {});
  response.json({ ok: true, vehicleCount: state.vehicles.length, syncedAt: state.syncedAt });
}

async function registerPushTokenController(request, response) {
  const token = await registerPushToken(request.body || {});
  response.json({ ok: true, token: token.token, registeredAt: token.registeredAt });
}

module.exports = { syncStateController, registerPushTokenController };
