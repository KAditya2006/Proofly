import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceAccount extends Document {
  name: string;
  apiKeyHash: string; // Hashed API key
  organizationId: mongoose.Types.ObjectId;
  permissions: string[]; // e.g. ['ESG_RECORD_READ', 'ESG_RECORD_WRITE']
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceAccountSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  apiKeyHash: { type: String, required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  permissions: [{ type: String }],
  status: {
    type: String,
    enum: ['ACTIVE', 'REVOKED', 'EXPIRED'],
    default: 'ACTIVE'
  },
  expiresAt: { type: Date },
  lastUsedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<IServiceAccount>('ServiceAccount', ServiceAccountSchema);
