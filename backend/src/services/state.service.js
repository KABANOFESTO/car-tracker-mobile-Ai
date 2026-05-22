const FleetState = require('../models/FleetState');

async function getCurrentState(ownerUserId) {
  let state = await FleetState.findOne({ ownerUserId }).lean();
  if (!state) {
    const created = await FleetState.create({ ownerUserId });
    state = created.toObject();
  }
  return state;
}

async function getFleetStateForUser(user) {
  if (user.role === 'admin') {
    return FleetState.find().sort({ updatedAt: -1 }).lean();
  }
  return getCurrentState(user._id.toString());
}

async function syncFleetState(ownerUserId, payload) {
  const next = await FleetState.findOneAndUpdate(
    { ownerUserId },
    {
      $set: {
        ownerUserId,
        vehicles: payload.vehicles || [],
        zones: payload.zones || [],
        protectionStates: payload.protectionStates || [],
        syncedAt: payload.syncedAt ? new Date(payload.syncedAt) : new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return next;
}

module.exports = { getCurrentState, getFleetStateForUser, syncFleetState };
