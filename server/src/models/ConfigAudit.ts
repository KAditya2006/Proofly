import mongoose, { Schema, Document } from 'mongoose';

export interface IConfigAudit extends Document {
  configType: 'ORGANIZATION' | 'USER' | 'REPORTING_PERIOD' | 'ESG_INDICATOR' | 'VALIDATION_RULE' | 'BRSR_MAPPING' | 'SYSTEM_SETTING';
  entityId: mongoose.Types.ObjectId | string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  previousValue?: any;
  newValue?: any;
  reason?: string;
  changedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ConfigAuditSchema: Schema = new Schema({
  configType: { 
    type: String, 
    enum: ['ORGANIZATION', 'USER', 'REPORTING_PERIOD', 'ESG_INDICATOR', 'VALIDATION_RULE', 'BRSR_MAPPING', 'SYSTEM_SETTING'],
    required: true 
  },
  entityId: { type: Schema.Types.Mixed, required: true },
  action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
  previousValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  reason: { type: String },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model<IConfigAudit>('ConfigAudit', ConfigAuditSchema);
