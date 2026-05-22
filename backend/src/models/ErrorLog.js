const { Schema, model } = require('mongoose');

const errorLogSchema = new Schema(
  {
    source: { type: String, required: true, index: true },
    severity: { type: String, required: true, enum: ['warning', 'error', 'critical'], default: 'error', index: true },
    message: { type: String, required: true },
    stack: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = model('ErrorLog', errorLogSchema);
