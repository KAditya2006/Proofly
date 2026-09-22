import mongoose, { Schema, Document } from 'mongoose';

export interface IApproval extends Document {
  submissionId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  action: 'APPROVED' | 'REQUEST_CORRECTION' | 'REJECTED';
  remarks?: string;
  timestamp: Date;
}

const ApprovalSchema: Schema = new Schema({
  submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true, index: true },
  reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    enum: ['APPROVED', 'REQUEST_CORRECTION', 'REJECTED'],
    required: true 
  },
  remarks: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IApproval>('Approval', ApprovalSchema);
