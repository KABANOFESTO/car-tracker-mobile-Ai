const { Schema, model } = require('mongoose');

const pushTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    platform: { type: String, default: 'unknown' },
    projectId: { type: String, default: null },
    registeredAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('PushToken', pushTokenSchema);
