import mongoose, { Schema, Document } from 'mongoose';

export interface IReportSnapshot extends Document {
  reportId: mongoose.Types.ObjectId;
  reportingPeriodId: mongoose.Types.ObjectId;
  timestamp: Date;
  data: {
    kpis: any[];
    disclosures: any[];
    evidenceRefs: any[];
    hierarchy: any;
    config: any;
  };
  integrityHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSnapshotSchema: Schema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  reportingPeriodId: { type: Schema.Types.ObjectId, ref: 'ReportingPeriod', required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  data: {
    kpis: [{ type: Schema.Types.Mixed }],
    disclosures: [{ type: Schema.Types.Mixed }],
    evidenceRefs: [{ type: Schema.Types.Mixed }],
    hierarchy: { type: Schema.Types.Mixed },
    config: { type: Schema.Types.Mixed }
  },
  integrityHash: { type: String }
}, { timestamps: true });

export default mongoose.model<IReportSnapshot>('ReportSnapshot', ReportSnapshotSchema);
