const { Schema, model } = require('mongoose');

const auditLogSchema = new Schema(
  {
    actorUserId: { type: String, default: null, index: true },
    actorEmail: { type: String, default: null },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String, default: null, index: true },
    ip: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = model('AuditLog', auditLogSchema);
