import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  projectId: mongoose.Types.ObjectId;
  reportingPeriodId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'CORRECTION_REQUESTED' | 'REJECTED';
  submittedAt: Date;
  reviewedAt?: Date;
  remarks?: string;
}

const SubmissionSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  reportingPeriodId: { type: Schema.Types.ObjectId, ref: 'ReportingPeriod', required: true },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['PENDING_REVIEW', 'APPROVED', 'CORRECTION_REQUESTED', 'REJECTED'],
    default: 'PENDING_REVIEW' 
  },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model<ISubmission>('Submission', SubmissionSchema);
