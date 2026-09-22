import mongoose, { Schema, Document } from 'mongoose';

export interface IImportBatch extends Document {
  integrationId?: mongoose.Types.ObjectId;
  source: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';
  totalRecords: number;
  validRecords: number;
  rejectedRecords: number;
  duplicateRecords: number;
  syncErrors: {
    recordId?: string;
    message: string;
    field?: string;
  }[];
  startedAt?: Date;
  completedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ImportBatchSchema: Schema = new Schema({
  integrationId: { type: Schema.Types.ObjectId, ref: 'Integration' },
  source: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'],
    default: 'QUEUED'
  },
  totalRecords: { type: Number, default: 0 },
  validRecords: { type: Number, default: 0 },
  rejectedRecords: { type: Number, default: 0 },
  duplicateRecords: { type: Number, default: 0 },
  syncErrors: [{
    recordId: { type: String },
    message: { type: String, required: true },
    field: { type: String }
  }],
  startedAt: { type: Date },
  completedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<IImportBatch>('ImportBatch', ImportBatchSchema);
