import mongoose, { Schema, Document } from 'mongoose';

export interface IReportTemplate extends Document {
  name: string;
  reportType: string;
  version: number;
  sections: Array<{
    title: string;
    order: number;
    disclosures: Array<{
      code: string; // e.g. "P6-3"
      title: string;
      type: 'QUANTITATIVE' | 'QUALITATIVE' | 'TABLE' | 'MIXED';
      indicatorCodes?: string[]; // references to ESGIndicator codes
    }>;
  }>;
  metadata?: any;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportTemplateSchema: Schema = new Schema({
  name: { type: String, required: true },
  reportType: { type: String, required: true },
  version: { type: Number, required: true, default: 1 },
  sections: [{
    title: { type: String, required: true },
    order: { type: Number, required: true },
    disclosures: [{
      code: { type: String, required: true },
      title: { type: String, required: true },
      type: { type: String, enum: ['QUANTITATIVE', 'QUALITATIVE', 'TABLE', 'MIXED'], required: true },
      indicatorCodes: [{ type: String }]
    }]
  }],
  metadata: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], default: 'DRAFT' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IReportTemplate>('ReportTemplate', ReportTemplateSchema);
