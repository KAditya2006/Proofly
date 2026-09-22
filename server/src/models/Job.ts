import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  type: 'REPORT_EXPORT' | 'BULK_UPLOAD';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  createdBy: mongoose.Types.ObjectId;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    type: { type: String, required: true, enum: ['REPORT_EXPORT', 'BULK_UPLOAD'] },
    status: { type: String, required: true, enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'], default: 'QUEUED' },
    progress: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    error: { type: String },
    result: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export default mongoose.model<IJob>('Job', JobSchema);
