import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  type: 'GROUP' | 'SUBSIDIARY' | 'BUSINESS_UNIT';
  parentId?: mongoose.Types.ObjectId;
  code: string;
  location?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['GROUP', 'SUBSIDIARY', 'BUSINESS_UNIT'],
    required: true 
  },
  parentId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
  code: { type: String, required: true, unique: true },
  location: { type: String },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true });

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
