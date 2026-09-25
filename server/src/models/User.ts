import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  employeeId: string;
  mustChangePassword: boolean;
  mobileNo: string;
  passwordHash: string;
  role: 'PROJECT_OFFICER' | 'BUSINESS_UNIT_REVIEWER' | 'SUBSIDIARY_MANAGER' | 'GROUP_ESG_TEAM' | 'AUDITOR' | 'ADMIN';
  organizationId: mongoose.Types.ObjectId;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  employeeId: { type: String, unique: true, sparse: true, index: true },
  mustChangePassword: { type: Boolean, default: true },
  mobileNo: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['PROJECT_OFFICER', 'BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER', 'GROUP_ESG_TEAM', 'AUDITOR', 'ADMIN'],
    required: true 
  },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'DISABLED'], default: 'ACTIVE' },
  isEmailVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
}, { timestamps: true });

UserSchema.index({ organizationId: 1 });
UserSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', UserSchema);
