const Incident = require('../models/Incident');
const { AppError } = require('../utils/errors');

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
    ownerUserId: doc.ownerUserId,
  };
}

function buildIncidentQuery(user, filters = {}) {
  const query = {};
  if (user.role !== 'admin') {
    query.ownerUserId = user._id.toString();
  } else if (filters.ownerUserId) {
    query.ownerUserId = filters.ownerUserId;
  }

  if (filters.vehicleId) query.vehicleId = filters.vehicleId;
  if (filters.severity) query.severity = filters.severity;
  if (filters.category) query.category = filters.category;
  if (filters.acknowledged != null) {
    query.acknowledged = filters.acknowledged === true || filters.acknowledged === 'true';
  }
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
  }
  return query;
}

async function listIncidents(user, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 200);
  const page = Math.max(Number(options.page) || 1, 1);
  const query = buildIncidentQuery(user, options);
  const [incidents, total, unacknowledged] = await Promise.all([
    Incident.find(query).sort({ lastSeenAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Incident.countDocuments(query),
    Incident.countDocuments({ ...query, acknowledged: false }),
  ]);

  return {
    items: incidents.map(toLeanIncident),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    summary: {
      total,
      unacknowledged,
      acknowledged: total - unacknowledged,
    },
  };
}

async function mergeIncidents(ownerUserId, incoming) {
  const created = [];

  for (const incident of incoming) {
    const found = await Incident.findOne({ ownerUserId, incidentKey: incident.incidentKey });
    if (!found) {
      const createdIncident = await Incident.create({
        ownerUserId,
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

async function markIncidentsNotified(ownerUserId, incidentKeys) {
  if (incidentKeys.length === 0) return;
  await Incident.updateMany(
    { ownerUserId, incidentKey: { $in: incidentKeys } },
    { $set: { notificationSentAt: new Date() } }
  );
}

async function acknowledgeIncident(user, incidentKey) {
  const query = { incidentKey };
  if (user.role !== 'admin') {
    query.ownerUserId = user._id.toString();
  }

  const incident = await Incident.findOne(query);
  if (!incident) {
    throw new AppError(404, 'Incident not found');
  }

  incident.acknowledged = true;
  await incident.save();
  return toLeanIncident(incident.toObject());
}

module.exports = { listIncidents, mergeIncidents, markIncidentsNotified, acknowledgeIncident };
