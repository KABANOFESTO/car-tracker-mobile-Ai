const env = require('../config/env');
const { listActivePushTokens } = require('./push-token.service');
const { markIncidentsNotified } = require('./incident.service');

function shouldNotify(incident) {
  return !incident.notificationSentAt && !incident.acknowledged && (
    incident.severity === 'critical' ||
    incident.category === 'security' ||
    incident.category === 'system'
  );
}

async function sendPushNotifications(ownerUserId, incidents) {
  const pushTokens = await listActivePushTokens(ownerUserId);
  if (pushTokens.length === 0) return [];

  const notifyCandidates = incidents.filter(shouldNotify);
  if (notifyCandidates.length === 0) return [];

  const messages = [];
  for (const incident of notifyCandidates) {
    for (const token of pushTokens) {
      messages.push({
        to: token.token,
        title: incident.title,
        body: `${incident.vehicleName}: ${incident.description}`,
        sound: 'default',
        data: {
          alertId: incident.incidentKey,
          vehicleId: incident.vehicleId,
          category: incident.category,
        },
      });
    }
  }

  const response = await fetch(env.expoPushApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push API ${response.status}`);
  }

  await markIncidentsNotified(ownerUserId, notifyCandidates.map((incident) => incident.incidentKey));
  return notifyCandidates;
}

module.exports = { sendPushNotifications };
