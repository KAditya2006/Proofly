import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  assigneeId?: mongoose.Types.ObjectId;
  assignerId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  indicatorId?: mongoose.Types.ObjectId;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: Date;
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  referenceType?: 'ESGRecord' | 'ValidationIssue' | 'AssuranceFinding' | 'BRSRDisclosure';
  referenceId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  indicatorId: { type: Schema.Types.ObjectId, ref: 'ESGIndicator' },
  priority: { 
    type: String, 
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  dueDate: { type: Date },
  status: { 
    type: String, 
    enum: ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'],
    default: 'OPEN',
    index: true
  },
  referenceType: { 
    type: String,
    enum: ['ESGRecord', 'ValidationIssue', 'AssuranceFinding', 'BRSRDisclosure']
  },
  referenceId: { type: Schema.Types.ObjectId }
}, { timestamps: true });

TaskSchema.index({ assigneeId: 1, status: 1 });
TaskSchema.index({ organizationId: 1 });
TaskSchema.index({ dueDate: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);
