import mongoose, { Schema, Document } from 'mongoose';

export interface IEvidence extends Document {
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  documentType?: string;
  projectId: mongoose.Types.ObjectId;
  reportingPeriodId: mongoose.Types.ObjectId;
  indicatorId?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  remarks?: string;
}

const EvidenceSchema: Schema = new Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  documentType: { type: String },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  reportingPeriodId: { type: Schema.Types.ObjectId, ref: 'ReportingPeriod', required: true, index: true },
  indicatorId: { type: Schema.Types.ObjectId, ref: 'ESGIndicator' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  verificationStatus: { 
    type: String, 
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING' 
  },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model<IEvidence>('Evidence', EvidenceSchema);
