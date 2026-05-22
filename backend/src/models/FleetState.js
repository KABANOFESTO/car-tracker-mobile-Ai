const { Schema, model } = require('mongoose');

const vehicleSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    channelId: { type: Number, required: true },
    readApiKey: { type: String, required: true },
    type: { type: String, required: true },
    licensePlate: { type: String, required: true },
    driver: { type: String, default: '' },
    status: { type: String, default: 'offline' },
    speed: { type: Number, default: 0 },
    location: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
    },
    direction: { type: Number, default: 0 },
    altitude: { type: Number, default: 0 },
    satellites: { type: Number, default: 0 },
    hdop: { type: Number, default: 99 },
    isOutsideFence: { type: Boolean, default: false },
    lastSeen: { type: String, default: new Date(0).toISOString() },
  },
  { _id: false }
);

const geofenceZoneSchema = new Schema(
  {
    id: { type: String, required: true },
    vehicleId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radius: { type: Number, required: true },
    activeFromHour: { type: Number, default: null },
    activeToHour: { type: Number, default: null },
  },
  { _id: false }
);

const protectionStateSchema = new Schema(
  {
    vehicleId: { type: String, required: true },
    armed: { type: Boolean, default: false },
    armedAt: { type: String, default: null },
  },
  { _id: false }
);

const fleetStateSchema = new Schema(
  {
    ownerUserId: { type: String, required: true, unique: true, index: true },
    vehicles: { type: [vehicleSchema], default: [] },
    zones: { type: [geofenceZoneSchema], default: [] },
    protectionStates: { type: [protectionStateSchema], default: [] },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model('FleetState', fleetStateSchema);
