import mongoose, { Schema, Document } from 'mongoose';

export interface IAssuranceSample extends Document {
  recordId: mongoose.Types.ObjectId; // ESGRecord
  reportingPeriodId: mongoose.Types.ObjectId;
  selectedBy: mongoose.Types.ObjectId; // Auditor ID
  reason: string;
  status: 'SELECTED' | 'UNDER_REVIEW' | 'CLEARED' | 'ISSUE_FOUND';
  createdAt: Date;
  updatedAt: Date;
}

const AssuranceSampleSchema: Schema = new Schema({
  recordId: { type: Schema.Types.ObjectId, ref: 'ESGRecord', required: true, unique: true },
  reportingPeriodId: { type: Schema.Types.ObjectId, ref: 'ReportingPeriod', required: true, index: true },
  selectedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['SELECTED', 'UNDER_REVIEW', 'CLEARED', 'ISSUE_FOUND'],
    default: 'SELECTED'
  }
}, { timestamps: true });

export default mongoose.model<IAssuranceSample>('AssuranceSample', AssuranceSampleSchema);
