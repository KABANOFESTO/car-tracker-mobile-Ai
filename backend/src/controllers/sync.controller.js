const { getFleetStateForUser, syncFleetState } = require('../services/state.service');
const { registerPushToken } = require('../services/push-token.service');

async function getFleetStateController(request, response) {
  const state = await getFleetStateForUser(request.user);
  response.json({ ok: true, state });
}

async function syncStateController(request, response) {
  const state = await syncFleetState(request.user._id.toString(), request.body || {});
  response.json({ ok: true, vehicleCount: state.vehicles.length, syncedAt: state.syncedAt });
}

async function registerPushTokenController(request, response) {
  const token = await registerPushToken(request.user._id.toString(), request.body || {});
  response.json({ ok: true, token: token.token, registeredAt: token.registeredAt });
}

module.exports = { getFleetStateController, syncStateController, registerPushTokenController };
