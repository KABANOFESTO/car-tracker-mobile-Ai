const env = require('../config/env');
const FleetState = require('../models/FleetState');
const { fetchThingSpeakFeed, mapThingSpeakFeed, dayBounds } = require('./thingspeak.service');
const { activeZoneFor, buildIncidentsForVehicle } = require('./incident-evaluator.service');
const { mergeIncidents } = require('./incident.service');
const { sendPushNotifications } = require('./push.service');
const { writeErrorLog } = require('./error-log.service');

let pollHandle = null;
let running = false;

async function runDispatcherCycle() {
  if (running) return { skipped: true };
  running = true;

  try {
    const states = await FleetState.find().lean();
    let evaluatedVehicles = 0;
    let createdIncidents = 0;
    let pushedIncidents = 0;

    for (const state of states) {
      const ownerUserId = state.ownerUserId;
      const vehicles = state.vehicles || [];
      const zones = state.zones || [];
      const protectionStates = state.protectionStates || [];
      if (vehicles.length === 0) continue;

      const incidents = [];

      for (const vehicle of vehicles) {
        evaluatedVehicles += 1;
        try {
          const latestFeeds = await fetchThingSpeakFeed(vehicle, { results: 2 });
          const currentPoint = mapThingSpeakFeed(vehicle, latestFeeds[latestFeeds.length - 1]);
          if (!currentPoint) continue;

          const previousPoint = latestFeeds.length > 1
            ? mapThingSpeakFeed(vehicle, latestFeeds[latestFeeds.length - 2])
            : null;

          const { start, end } = dayBounds(currentPoint.timestamp.slice(0, 10));
          const todayFeeds = await fetchThingSpeakFeed(vehicle, { results: 2000, start, end });
          const todayPoints = todayFeeds.map((feed) => mapThingSpeakFeed(vehicle, feed)).filter(Boolean);

          incidents.push(
            ...buildIncidentsForVehicle(
              vehicle,
              currentPoint,
              previousPoint,
              activeZoneFor(vehicle, zones),
              protectionStates,
              todayPoints
            )
          );
        } catch (error) {
          incidents.push({
            incidentKey: `system:${vehicle.id}:dispatcher-failure`,
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            timestamp: new Date(),
            title: 'Dispatcher fetch failed',
            description: `${vehicle.name} could not be evaluated by the backend dispatcher.`,
            severity: 'warning',
            category: 'system',
            relatedZoneName: null,
            payload: { message: error.message },
          });
          await writeErrorLog({
            source: 'dispatcher',
            severity: 'warning',
            message: `Failed to evaluate ${vehicle.name}`,
            stack: error.stack || null,
            metadata: { ownerUserId, vehicleId: vehicle.id },
          });
        }
      }

      const created = await mergeIncidents(ownerUserId, incidents);
      const pushed = await sendPushNotifications(ownerUserId, created);
      createdIncidents += created.length;
      pushedIncidents += pushed.length;
    }

    return {
      ok: true,
      evaluatedVehicles,
      createdIncidents,
      pushedIncidents,
    };
  } finally {
    running = false;
  }
}

async function startDispatcher() {
  if (pollHandle) clearInterval(pollHandle);
  await runDispatcherCycle().catch(() => undefined);
  pollHandle = setInterval(() => {
    runDispatcherCycle().catch((error) => {
      console.error('[dispatcher]', error.message);
      writeErrorLog({
        source: 'dispatcher',
        severity: 'critical',
        message: error.message,
        stack: error.stack || null,
      }).catch(() => undefined);
    });
  }, env.dispatcherPollIntervalMs);
}

module.exports = { runDispatcherCycle, startDispatcher };
