const FleetState = require('../models/FleetState');

async function getCurrentState() {
  let state = await FleetState.findOne({ key: 'primary' }).lean();
  if (!state) {
    const created = await FleetState.create({ key: 'primary' });
    state = created.toObject();
  }
  return state;
}

async function syncFleetState(payload) {
  const next = await FleetState.findOneAndUpdate(
    { key: 'primary' },
    {
      $set: {
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

module.exports = { getCurrentState, syncFleetState };
