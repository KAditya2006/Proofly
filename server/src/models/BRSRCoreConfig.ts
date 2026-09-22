import mongoose, { Schema, Document } from 'mongoose';

export interface IBRSRCoreConfig extends Document {
  attributeName: string;
  description?: string;
  indicatorIds: mongoose.Types.ObjectId[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const BRSRCoreConfigSchema: Schema = new Schema({
  attributeName: { type: String, required: true, unique: true },
  description: { type: String },
  indicatorIds: [{ type: Schema.Types.ObjectId, ref: 'ESGIndicator' }],
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

export default mongoose.model<IBRSRCoreConfig>('BRSRCoreConfig', BRSRCoreConfigSchema);
