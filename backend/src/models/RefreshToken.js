const { Schema, model } = require('mongoose');

const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    createdByIp: { type: String, default: null },
    replacedByTokenHash: { type: String, default: null },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = model('RefreshToken', refreshTokenSchema);
