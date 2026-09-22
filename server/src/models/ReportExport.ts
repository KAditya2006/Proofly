import mongoose, { Schema, Document } from 'mongoose';

export interface IReportExport extends Document {
  reportId: mongoose.Types.ObjectId;
  format: 'PDF' | 'XLSX' | 'CSV' | 'ZIP';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileUrl?: string;
  errorMessage?: string;
  requestedBy: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportExportSchema: Schema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  format: { type: String, enum: ['PDF', 'XLSX', 'CSV', 'ZIP'], required: true },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  fileUrl: { type: String },
  errorMessage: { type: String },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  completedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IReportExport>('ReportExport', ReportExportSchema);
