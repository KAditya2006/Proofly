import mongoose, { Schema, Document } from 'mongoose';

export interface IReportNarrative extends Document {
  reportId: mongoose.Types.ObjectId;
  disclosureCode: string;
  content: string;
  draftContent?: string;
  reviewerComment?: string;
  status: 'DRAFT' | 'REVISION_REQUESTED' | 'APPROVED' | 'FINALIZED';
  lastEditedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportNarrativeSchema: Schema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  disclosureCode: { type: String, required: true },
  content: { type: String, default: '' },
  draftContent: { type: String },
  reviewerComment: { type: String },
  status: { type: String, enum: ['DRAFT', 'REVISION_REQUESTED', 'APPROVED', 'FINALIZED'], default: 'DRAFT' },
  lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IReportNarrative>('ReportNarrative', ReportNarrativeSchema);
