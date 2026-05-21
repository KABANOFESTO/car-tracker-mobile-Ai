const { Schema, model } = require('mongoose');

const requestLogSchema = new Schema(
  {
    method: { type: String, required: true },
    path: { type: String, required: true, index: true },
    statusCode: { type: Number, required: true, index: true },
    durationMs: { type: Number, required: true },
    ip: { type: String, default: null },
    userAgent: { type: String, default: '' },
    userId: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

module.exports = model('RequestLog', requestLogSchema);
