const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'owner'], default: 'admin' },
    active: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    onboardingEmailSentAt: { type: Date, default: null },
    sessionVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
