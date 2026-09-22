import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  before?: any;
  after?: any;
  timestamp: Date;
  ipAddress?: string;
}

const AuditLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: { type: String }
});

AuditLogSchema.index({ entityId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ actorId: 1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
