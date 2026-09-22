import mongoose, { Schema, Document } from 'mongoose';

export interface IAssuranceFinding extends Document {
  sampleId: mongoose.Types.ObjectId;
  recordId: mongoose.Types.ObjectId; // ESGRecord reference for convenience
  reportingPeriodId: mongoose.Types.ObjectId;
  findingTitle: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  createdBy: mongoose.Types.ObjectId;
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssuranceFindingSchema: Schema = new Schema({
  sampleId: { type: Schema.Types.ObjectId, ref: 'AssuranceSample', required: true },
  recordId: { type: Schema.Types.ObjectId, ref: 'ESGRecord', required: true, index: true },
  reportingPeriodId: { type: Schema.Types.ObjectId, ref: 'ReportingPeriod', required: true, index: true },
  findingTitle: { type: String, required: true },
  description: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['OPEN', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
    index: true
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolutionRemarks: { type: String }
}, { timestamps: true });

export default mongoose.model<IAssuranceFinding>('AssuranceFinding', AssuranceFindingSchema);
