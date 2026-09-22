import mongoose, { Schema, Document } from 'mongoose';

export interface IReportQualityCheck extends Document {
  reportId: mongoose.Types.ObjectId;
  status: 'READY' | 'WARNING' | 'BLOCKED';
  checks: {
    dataCompleteness: { status: 'PASS' | 'FAIL' | 'WARNING'; message: string; details?: any };
    validation: { status: 'PASS' | 'FAIL'; message: string; details?: any };
    evidenceCoverage: { status: 'PASS' | 'FAIL' | 'WARNING'; message: string; details?: any };
    brsrMapping: { status: 'PASS' | 'FAIL' | 'WARNING'; message: string; details?: any };
    assuranceControls: { status: 'PASS' | 'FAIL' | 'WARNING'; message: string; details?: any };
    governance: { status: 'PASS' | 'FAIL'; message: string; details?: any };
  };
  anomalies: Array<{
    type: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    disclosureCode?: string;
    indicatorCode?: string;
    details?: any;
    resolved?: boolean;
    resolvedBy?: mongoose.Types.ObjectId;
  }>;
  runAt: Date;
}

const ReportQualityCheckSchema: Schema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true, unique: true },
  status: { type: String, enum: ['READY', 'WARNING', 'BLOCKED'], required: true },
  checks: {
    dataCompleteness: {
      status: { type: String, enum: ['PASS', 'FAIL', 'WARNING'] },
      message: String,
      details: Schema.Types.Mixed
    },
    validation: {
      status: { type: String, enum: ['PASS', 'FAIL'] },
      message: String,
      details: Schema.Types.Mixed
    },
    evidenceCoverage: {
      status: { type: String, enum: ['PASS', 'FAIL', 'WARNING'] },
      message: String,
      details: Schema.Types.Mixed
    },
    brsrMapping: {
      status: { type: String, enum: ['PASS', 'FAIL', 'WARNING'] },
      message: String,
      details: Schema.Types.Mixed
    },
    assuranceControls: {
      status: { type: String, enum: ['PASS', 'FAIL', 'WARNING'] },
      message: String,
      details: Schema.Types.Mixed
    },
    governance: {
      status: { type: String, enum: ['PASS', 'FAIL'] },
      message: String,
      details: Schema.Types.Mixed
    }
  },
  anomalies: [{
    type: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'] },
    message: String,
    disclosureCode: String,
    indicatorCode: String,
    details: Schema.Types.Mixed,
    resolved: { type: Boolean, default: false },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  runAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IReportQualityCheck>('ReportQualityCheck', ReportQualityCheckSchema);
