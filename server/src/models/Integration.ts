import mongoose, { Schema, Document } from 'mongoose';

export interface IIntegration extends Document {
  name: string;
  type: 'ERP' | 'HRMS' | 'FINANCE' | 'DOCUMENT_STORAGE' | 'IDENTITY_PROVIDER' | 'OTHER';
  protocol: 'REST_API' | 'FILE_EXCHANGE' | 'WEBHOOK';
  status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'CONNECTED' | 'ERROR' | 'DISABLED';
  config: {
    baseUrl?: string;
    authType?: 'API_KEY' | 'OAUTH2' | 'BASIC' | 'NONE';
    credentialsEncrypted?: string;
    webhookSecret?: string;
  };
  mappingRules: {
    externalField: string;
    indicatorId: mongoose.Types.ObjectId;
    conversionFactor?: number;
  }[];
  syncSchedule?: string; // cron expression
  lastSyncAt?: Date;
  lastSyncStatus?: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    enum: ['ERP', 'HRMS', 'FINANCE', 'DOCUMENT_STORAGE', 'IDENTITY_PROVIDER', 'OTHER'],
    required: true 
  },
  protocol: { 
    type: String, 
    enum: ['REST_API', 'FILE_EXCHANGE', 'WEBHOOK'],
    required: true 
  },
  status: {
    type: String,
    enum: ['NOT_CONFIGURED', 'CONFIGURED', 'CONNECTED', 'ERROR', 'DISABLED'],
    default: 'NOT_CONFIGURED'
  },
  config: {
    baseUrl: { type: String },
    authType: { type: String, enum: ['API_KEY', 'OAUTH2', 'BASIC', 'NONE'] },
    credentialsEncrypted: { type: String }, // In real app, this would be encrypted symmetric key
    webhookSecret: { type: String }
  },
  mappingRules: [{
    externalField: { type: String, required: true },
    indicatorId: { type: Schema.Types.ObjectId, ref: 'ESGIndicator', required: true },
    conversionFactor: { type: Number, default: 1 }
  }],
  syncSchedule: { type: String },
  lastSyncAt: { type: Date },
  lastSyncStatus: { type: String, enum: ['SUCCESS', 'FAILED', 'PARTIAL'] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<IIntegration>('Integration', IntegrationSchema);
