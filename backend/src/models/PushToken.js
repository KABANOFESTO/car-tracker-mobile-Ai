const { Schema, model } = require('mongoose');

const pushTokenSchema = new Schema(
  {
    ownerUserId: { type: String, required: true, index: true },
    token: { type: String, required: true, index: true },
    platform: { type: String, default: 'unknown' },
    projectId: { type: String, default: null },
    registeredAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

pushTokenSchema.index({ ownerUserId: 1, token: 1 }, { unique: true });

module.exports = model('PushToken', pushTokenSchema);
