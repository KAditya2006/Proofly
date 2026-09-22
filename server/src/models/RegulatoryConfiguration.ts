import mongoose, { Schema, Document } from 'mongoose';

export interface IRegulatoryConfiguration extends Document {
  version: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
}

const RegulatoryConfigurationSchema: Schema = new Schema({
  version: { type: String, required: true, unique: true },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date },
  status: { type: String, enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], default: 'DRAFT' },
  remarks: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IRegulatoryConfiguration>('RegulatoryConfiguration', RegulatoryConfigurationSchema);
