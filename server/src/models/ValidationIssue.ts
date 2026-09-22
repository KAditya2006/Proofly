import mongoose, { Schema, Document } from 'mongoose';

export interface IValidationIssue extends Document {
  esgRecordId?: mongoose.Types.ObjectId;
  indicatorId?: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  rule: string;
  status: 'OPEN' | 'RESOLVED' | 'IGNORED';
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ValidationIssueSchema: Schema = new Schema({
  esgRecordId: { type: Schema.Types.ObjectId, ref: 'ESGRecord' },
  indicatorId: { type: Schema.Types.ObjectId, ref: 'ESGIndicator' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'ERROR'], required: true },
  message: { type: String, required: true },
  rule: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'RESOLVED', 'IGNORED'], default: 'OPEN', index: true },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IValidationIssue>('ValidationIssue', ValidationIssueSchema);
