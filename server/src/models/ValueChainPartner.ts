import mongoose, { Schema, Document } from 'mongoose';

export interface IValueChainPartner extends Document {
  name: string;
  type: 'SUPPLIER' | 'CUSTOMER' | 'CONTRACTOR' | 'VENDOR' | 'OTHER';
  organizationId: mongoose.Types.ObjectId; // Which internal Org manages them
  reportingPeriodId: mongoose.Types.ObjectId;
  contactEmail?: string;
  status: 'NOT_STARTED' | 'INVITED' | 'DATA_REQUESTED' | 'DATA_SUBMITTED' | 'APPROVED';
  createdAt: Date;
  updatedAt: Date;
}

const ValueChainPartnerSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['SUPPLIER', 'CUSTOMER', 'CONTRACTOR', 'VENDOR', 'OTHER'],
    required: true 
  },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  reportingPeriodId: { type: Schema.Types.ObjectId, ref: 'ReportingPeriod', required: true, index: true },
  contactEmail: { type: String },
  status: { 
    type: String, 
    enum: ['NOT_STARTED', 'INVITED', 'DATA_REQUESTED', 'DATA_SUBMITTED', 'APPROVED'],
    default: 'NOT_STARTED'
  }
}, { timestamps: true });

export default mongoose.model<IValueChainPartner>('ValueChainPartner', ValueChainPartnerSchema);
