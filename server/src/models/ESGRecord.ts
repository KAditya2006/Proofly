import mongoose, { Schema, Document } from 'mongoose';

export interface IESGRecord extends Document {
  indicatorId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  valueChainPartnerId?: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  reportingPeriodId: mongoose.Types.ObjectId;
  value: number | string | boolean;
  unit: string;
  source?: string;
  calculationMethod?: string;
  remarks?: string;
  evidenceIds: mongoose.Types.ObjectId[];
  comments?: string;
  // External Integration Provenance Fields
  sourceSystem?: string;
  sourceRecordId?: string;
  sourceTimestamp?: Date;
  syncId?: string;
  importBatchId?: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'VALIDATION_FAILED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CORRECTION_REQUIRED' | 'APPROVED' | 'REJECTED';
  correctionReason?: string;
  submittedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ESGRecordSchema: Schema = new Schema({
  indicatorId: { type: Schema.Types.ObjectId, ref: 'ESGIndicator', required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
  valueChainPartnerId: { type: Schema.Types.ObjectId, ref: 'ValueChainPartner', index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  reportingPeriodId: { type: Schema.Types.ObjectId, ref: 'ReportingPeriod', required: true, index: true },
  value: { type: Schema.Types.Mixed, required: true },
  unit: { type: String, required: true },
  source: { type: String },
  calculationMethod: { type: String },
  remarks: { type: String },
  evidenceIds: [{ type: Schema.Types.ObjectId, ref: 'Evidence' }],
  comments: { type: String },
  // External Integration Provenance Fields
  sourceSystem: { type: String, trim: true },
  sourceRecordId: { type: String, trim: true },
  sourceTimestamp: { type: Date },
  syncId: { type: String, trim: true },
  importBatchId: { type: Schema.Types.ObjectId, ref: 'ImportBatch' },
  status: { 
    type: String, 
    enum: ['DRAFT', 'VALIDATION_FAILED', 'SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED', 'REJECTED'],
    default: 'DRAFT',
    index: true
  },
  correctionReason: { type: String },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// High-value production indexes
ESGRecordSchema.index({ projectId: 1, indicatorId: 1, reportingPeriodId: 1 }, { unique: true });
ESGRecordSchema.index({ status: 1 });
ESGRecordSchema.index({ organizationId: 1 });
ESGRecordSchema.index({ importBatchId: 1 });

export default mongoose.model<IESGRecord>('ESGRecord', ESGRecordSchema);
