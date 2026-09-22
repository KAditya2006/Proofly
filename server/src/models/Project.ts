import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  projectCode: string;
  organizationId: mongoose.Types.ObjectId;
  businessUnitId: mongoose.Types.ObjectId;
  subsidiaryId: mongoose.Types.ObjectId;
  location: string;
  sector: string;
  startDate?: Date;
  endDate?: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  assignedOfficers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  name: { type: String, required: true },
  projectCode: { type: String, required: true, unique: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, required: true },
  businessUnitId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
  subsidiaryId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
  location: { type: String, required: true },
  sector: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'ON_HOLD'], default: 'ACTIVE' },
  assignedOfficers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model<IProject>('Project', ProjectSchema);
