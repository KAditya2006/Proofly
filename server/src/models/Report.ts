import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  name: string;
  reportType: 'BRSR_COMPREHENSIVE' | 'BRSR_LITE' | 'ESG_SUMMARY' | 'ASSURANCE_EVIDENCE_PACK' | 'DISCLOSURE_EVIDENCE_PACK' | 'EXECUTIVE_ESG_SUMMARY' | 'INTERNAL_COMPLIANCE_REPORT';
  reportingPeriodId: mongoose.Types.ObjectId;
  scope: {
    level: 'GROUP' | 'SUBSIDIARY' | 'BUSINESS_UNIT' | 'PROJECT';
    organizationId: mongoose.Types.ObjectId;
  };
  generatedBy: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'IN_REVIEW' | 'READY_FOR_FINALIZATION' | 'FINALIZED' | 'ARCHIVED' | 'GENERATING' | 'FAILED';
  fileUrl?: string;
  metadata?: any;
  version: number;
  reportTemplateId?: mongoose.Types.ObjectId;
  snapshotId?: mongoose.Types.ObjectId;
  parentReportId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
  name: { type: String, required: true },
  reportType: { 
    type: String, 
    enum: [
      'BRSR_COMPREHENSIVE', 'BRSR_LITE', 'ESG_SUMMARY', 
      'ASSURANCE_EVIDENCE_PACK', 'DISCLOSURE_EVIDENCE_PACK', 
      'EXECUTIVE_ESG_SUMMARY', 'INTERNAL_COMPLIANCE_REPORT'
    ],
    required: true 
  },
  reportingPeriodId: { type: Schema.Types.ObjectId, ref: 'ReportingPeriod', required: true },
  scope: {
    level: { type: String, enum: ['GROUP', 'SUBSIDIARY', 'BUSINESS_UNIT', 'PROJECT'], required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true }
  },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['DRAFT', 'IN_REVIEW', 'READY_FOR_FINALIZATION', 'FINALIZED', 'ARCHIVED', 'GENERATING', 'FAILED'],
    default: 'GENERATING' 
  },
  fileUrl: { type: String },
  metadata: { type: Schema.Types.Mixed },
  version: { type: Number, default: 1 },
  reportTemplateId: { type: Schema.Types.ObjectId, ref: 'ReportTemplate' },
  snapshotId: { type: Schema.Types.ObjectId, ref: 'ReportSnapshot' },
  parentReportId: { type: Schema.Types.ObjectId, ref: 'Report' }
}, { timestamps: true });

ReportSchema.index(
  { reportingPeriodId: 1, 'scope.level': 1, 'scope.organizationId': 1, reportType: 1, version: 1 },
  { unique: true, name: 'unique_report_version' }
);

export default mongoose.model<IReport>('Report', ReportSchema);
