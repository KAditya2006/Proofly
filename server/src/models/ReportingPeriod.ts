import mongoose, { Schema, Document } from 'mongoose';

export interface IReportingPeriod extends Document {
  name: string;
  financialYear: string;
  startDate: Date;
  endDate: Date;
  status: 'PLANNING' | 'OPEN' | 'DATA_COLLECTION' | 'REVIEW' | 'ASSURANCE' | 'FINALIZATION' | 'CLOSED' | 'ARCHIVED';
  isCurrent: boolean;
}

const ReportingPeriodSchema: Schema = new Schema({
  name: { type: String, required: true },
  financialYear: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['PLANNING', 'OPEN', 'DATA_COLLECTION', 'REVIEW', 'ASSURANCE', 'FINALIZATION', 'CLOSED', 'ARCHIVED'], default: 'PLANNING' },
  isCurrent: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IReportingPeriod>('ReportingPeriod', ReportingPeriodSchema);
