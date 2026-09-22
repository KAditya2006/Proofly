import mongoose, { Schema, Document } from 'mongoose';

export interface IBRSRDisclosure extends Document {
  disclosureId: string; // e.g., "P3.1"
  section: 'A' | 'B' | 'C';
  principle?: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8' | 'P9';
  question: string;
  indicatorType: 'ESSENTIAL' | 'LEADERSHIP';
  applicableRoles: string[]; // Orgs this applies to
  requiredEvidence: string[]; // List of required doc types
  status: 'ACTIVE' | 'INACTIVE';
  regulatoryConfigId: mongoose.Types.ObjectId;
}

const BRSRDisclosureSchema: Schema = new Schema({
  disclosureId: { type: String, required: true },
  section: { type: String, enum: ['A', 'B', 'C'], required: true },
  principle: { 
    type: String, 
    enum: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'] 
  },
  question: { type: String, required: true },
  indicatorType: { type: String, enum: ['ESSENTIAL', 'LEADERSHIP'], required: true },
  applicableRoles: [{ type: String }],
  requiredEvidence: [{ type: String }],
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  regulatoryConfigId: { type: Schema.Types.ObjectId, ref: 'RegulatoryConfiguration', required: true }
}, { timestamps: true });

BRSRDisclosureSchema.index({ disclosureId: 1, regulatoryConfigId: 1 }, { unique: true });

export default mongoose.model<IBRSRDisclosure>('BRSRDisclosure', BRSRDisclosureSchema);
