import mongoose, { Schema, Document } from 'mongoose';

export interface IComplianceControl extends Document {
  controlId: string; // e.g., "CTRL-01"
  requirement: string;
  systemControl: string;
  evidenceType: string;
  ownerRole: string;
  status: 'IMPLEMENTED' | 'PARTIALLY_IMPLEMENTED' | 'NOT_APPLICABLE' | 'NEEDS_ATTENTION';
  remarks?: string;
}

const ComplianceControlSchema: Schema = new Schema({
  controlId: { type: String, required: true, unique: true },
  requirement: { type: String, required: true },
  systemControl: { type: String, required: true },
  evidenceType: { type: String, required: true },
  ownerRole: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['IMPLEMENTED', 'PARTIALLY_IMPLEMENTED', 'NOT_APPLICABLE', 'NEEDS_ATTENTION'],
    default: 'IMPLEMENTED'
  },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model<IComplianceControl>('ComplianceControl', ComplianceControlSchema);
