import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
  sessionTimeout: string;
  maxFailedLogins: string;
  passwordComplexity: 'low' | 'medium' | 'high';
  maintenanceMode: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  enableAuditLogging: boolean;
  dataRetentionDays: string;
  updatedAt: Date;
}

const SystemSettingSchema: Schema = new Schema({
  sessionTimeout: { type: String, default: '30' },
  maxFailedLogins: { type: String, default: '5' },
  passwordComplexity: { type: String, enum: ['low', 'medium', 'high'], default: 'high' },
  maintenanceMode: { type: Boolean, default: false },
  smtpHost: { type: String, default: 'smtp.meil.com' },
  smtpPort: { type: String, default: '587' },
  smtpUser: { type: String, default: 'no-reply@meil.com' },
  enableAuditLogging: { type: Boolean, default: true },
  dataRetentionDays: { type: String, default: '365' }
}, { timestamps: { createdAt: false, updatedAt: true } });

export default mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
