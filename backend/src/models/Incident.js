const { Schema, model } = require('mongoose');

const incidentSchema = new Schema(
  {
    ownerUserId: { type: String, required: true, index: true },
    incidentKey: { type: String, required: true, index: true },
    vehicleId: { type: String, required: true, index: true },
    vehicleName: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, required: true, enum: ['critical', 'warning', 'info'] },
    category: { type: String, required: true },
    acknowledged: { type: Boolean, default: false },
    relatedZoneName: { type: String, default: null },
    firstSeenAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    occurrenceCount: { type: Number, default: 1 },
    notificationSentAt: { type: Date, default: null },
    payload: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

incidentSchema.index({ ownerUserId: 1, incidentKey: 1 }, { unique: true });

module.exports = model('Incident', incidentSchema);
