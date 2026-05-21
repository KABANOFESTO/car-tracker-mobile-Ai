const env = require('../config/env');
const { getCurrentState } = require('./state.service');
const { fetchThingSpeakFeed, mapThingSpeakFeed, dayBounds } = require('./thingspeak.service');
const { activeZoneFor, buildIncidentsForVehicle } = require('./incident-evaluator.service');
const { mergeIncidents } = require('./incident.service');
const { sendPushNotifications } = require('./push.service');

let pollHandle = null;
let running = false;

async function runDispatcherCycle() {
  if (running) return { skipped: true };
  running = true;

  try {
    const state = await getCurrentState();
    const vehicles = state.vehicles || [];
    const zones = state.zones || [];
    const protectionStates = state.protectionStates || [];

    if (vehicles.length === 0) {
      return { ok: true, evaluatedVehicles: 0, createdIncidents: 0, pushedIncidents: 0 };
    }

    const incidents = [];

    for (const vehicle of vehicles) {
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
      }
    }

    const createdIncidents = await mergeIncidents(incidents);
    const pushedIncidents = await sendPushNotifications(createdIncidents);

    return {
      ok: true,
      evaluatedVehicles: vehicles.length,
      createdIncidents: createdIncidents.length,
      pushedIncidents: pushedIncidents.length,
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
    });
  }, env.dispatcherPollIntervalMs);
}

module.exports = { runDispatcherCycle, startDispatcher };
