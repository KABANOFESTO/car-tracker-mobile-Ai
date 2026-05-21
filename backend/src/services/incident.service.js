const Incident = require('../models/Incident');

function toLeanIncident(doc) {
  return {
    id: doc.incidentKey,
    incidentKey: doc.incidentKey,
    vehicleId: doc.vehicleId,
    vehicleName: doc.vehicleName,
    timestamp: doc.timestamp,
    title: doc.title,
    description: doc.description,
    severity: doc.severity,
    category: doc.category,
    acknowledged: doc.acknowledged,
    relatedZoneName: doc.relatedZoneName,
    firstSeenAt: doc.firstSeenAt,
    lastSeenAt: doc.lastSeenAt,
    occurrenceCount: doc.occurrenceCount,
    notificationSentAt: doc.notificationSentAt,
    payload: doc.payload,
  };
}

async function listIncidents(limit = 200) {
  const incidents = await Incident.find().sort({ lastSeenAt: -1 }).limit(limit).lean();
  return incidents.map(toLeanIncident);
}

async function mergeIncidents(incoming) {
  const created = [];

  for (const incident of incoming) {
    const found = await Incident.findOne({ incidentKey: incident.incidentKey });
    if (!found) {
      const createdIncident = await Incident.create({
        ...incident,
        firstSeenAt: incident.timestamp,
        lastSeenAt: incident.timestamp,
        occurrenceCount: 1,
        acknowledged: false,
        notificationSentAt: null,
      });
      created.push(toLeanIncident(createdIncident.toObject()));
      continue;
    }

    found.title = incident.title;
    found.description = incident.description;
    found.timestamp = incident.timestamp;
    found.severity = incident.severity;
    found.category = incident.category;
    found.relatedZoneName = incident.relatedZoneName || found.relatedZoneName;
    found.payload = incident.payload || found.payload;
    found.lastSeenAt = incident.timestamp;
    found.occurrenceCount += 1;
    await found.save();
  }

  return created;
}

async function markIncidentsNotified(incidentKeys) {
  if (incidentKeys.length === 0) return;
  await Incident.updateMany(
    { incidentKey: { $in: incidentKeys } },
    { $set: { notificationSentAt: new Date() } }
  );
}

module.exports = { listIncidents, mergeIncidents, markIncidentsNotified };
