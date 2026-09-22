import request from 'supertest';
import express from 'express';
import reportRoutes from '../src/routes/reportRoutes';
import Report from '../src/models/Report';
import ReportSnapshot from '../src/models/ReportSnapshot';
import Job from '../src/models/Job';
import AuditLog from '../src/models/AuditLog';

const app = express();
app.use(express.json());
app.use('/api/reports', reportRoutes);

jest.mock('../src/models/Report');
jest.mock('../src/models/ReportSnapshot');
jest.mock('../src/models/Job');
jest.mock('../src/utils/auditLogger', () => ({
  logAudit: jest.fn().mockResolvedValue(true)
}));

// Mock Auth Middleware
jest.mock('../src/middleware/authMiddleware', () => ({
  protect: (req: any, res: any, next: any) => {
    req.user = { _id: 'admin1', role: 'GROUP_ESG_TEAM' };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => next()
}));

// Mock consolidationService
jest.mock('../src/services/consolidationService', () => ({
  getConsolidatedKPIs: jest.fn().mockResolvedValue([])
}));

// Mock readinessService
jest.mock('../src/services/readinessService', () => ({
  calculateReadiness: jest.fn().mockResolvedValue({ totalReadinessPercentage: 100 })
}));

describe('Reporting & Audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('finalizeReport', () => {
    it('should finalize a report and create an immutable snapshot', async () => {
      const saveMock = jest.fn().mockImplementation(async () => { console.log('SAVE MOCK CALLED'); return true; });
      const mockReport: any = {
        _id: 'report1',
        status: 'IN_REVIEW',
        reportingPeriodId: 'rp1',
        scope: { level: 'GROUP' },
        metadata: { kpis: [] },
        save: saveMock
      };

      (Report.findById as jest.Mock).mockResolvedValue(mockReport);
      (ReportSnapshot.create as jest.Mock).mockResolvedValue({ _id: 'snapshot1' });

      const res = await request(app)
        .post('/api/reports/report1/finalize')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(mockReport.status).toBe('FINALIZED');
      expect(mockReport.snapshotId).toBe('snapshot1');
      expect(ReportSnapshot.create).toHaveBeenCalled();
      
      const { logAudit } = require('../src/utils/auditLogger');
      expect(logAudit).toHaveBeenCalled();
    });
  });

  describe('exportReport', () => {
    it('should queue an export job and return 202', async () => {
      (Job.findOne as jest.Mock).mockResolvedValue(null);
      (Job.create as jest.Mock).mockResolvedValue({ _id: 'job1' });

      const res = await request(app)
        .get('/api/reports/report1/export?format=PDF')
        .set('Authorization', 'Bearer token');

      if (res.status !== 202) console.error(res.body);

      expect(res.status).toBe(202);
      expect(res.body.jobId).toBe('job1');
      expect(Job.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'REPORT_EXPORT',
        status: 'QUEUED'
      }));
    });
  });
});
