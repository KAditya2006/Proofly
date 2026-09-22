import request from 'supertest';
import express from 'express';
import assuranceRoutes from '../src/routes/assuranceRoutes';
import AssuranceSample from '../src/models/AssuranceSample';
import AssuranceFinding from '../src/models/AssuranceFinding';
import ESGRecord from '../src/models/ESGRecord';
import AuditLog from '../src/models/AuditLog';

const app = express();
app.use(express.json());
app.use('/api/assurance', assuranceRoutes);

jest.mock('../src/models/AssuranceSample');
jest.mock('../src/models/AssuranceFinding');
jest.mock('../src/models/ESGRecord');
jest.mock('../src/models/AuditLog');
jest.mock('../src/utils/auditLogger', () => ({
  logAudit: jest.fn().mockResolvedValue(true)
}));

// Mock Auth Middleware
jest.mock('../src/middleware/authMiddleware', () => ({
  protect: (req: any, res: any, next: any) => {
    req.user = { _id: 'auditor1', role: 'AUDITOR', organizationId: 'org1' };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => next()
}));

jest.mock('../src/utils/hierarchy', () => ({
  getAuthorizedProjectIds: jest.fn().mockResolvedValue(['proj1'])
}));

describe('Assurance & Audit Trails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSample', () => {
    it('should create an assurance sample', async () => {
      (ESGRecord.findById as jest.Mock).mockResolvedValue({ _id: 'rec1', status: 'APPROVED', projectId: 'proj1' });
      (AssuranceSample.findOne as jest.Mock).mockResolvedValue(null);
      (AssuranceSample.create as jest.Mock).mockResolvedValue({ _id: 'sample1', recordId: 'rec1' });
      (AuditLog.create as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post('/api/assurance/samples')
        .set('Authorization', 'Bearer token')
        .send({ recordId: 'rec1', reportingPeriodId: 'rp1', reason: 'Random check' });

      expect(res.status).toBe(201);
      expect(AssuranceSample.create).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
    });

    it('should fail if record does not exist', async () => {
      (ESGRecord.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/assurance/samples')
        .set('Authorization', 'Bearer token')
        .send({ recordId: 'rec1', reportingPeriodId: 'rp1' });

      expect(res.status).toBe(404);
    });
  });

  describe('createFinding', () => {
    it('should create a finding and update sample status', async () => {
      const mockSample: any = {
        _id: 'sample1',
        recordId: { _id: 'rec1', projectId: 'proj1' },
        reportingPeriodId: 'rp1',
        status: 'SELECTED',
        save: jest.fn().mockResolvedValue(true)
      };

      (AssuranceSample.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSample)
      });
      (AssuranceFinding.create as jest.Mock).mockResolvedValue({ _id: 'finding1' });
      (AuditLog.create as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post('/api/assurance/findings')
        .set('Authorization', 'Bearer token')
        .send({ sampleId: 'sample1', findingTitle: 'Missing docs', severity: 'HIGH' });

      expect(res.status).toBe(201);
      expect(mockSample.status).toBe('ISSUE_FOUND');
      expect(mockSample.save).toHaveBeenCalled();
      expect(AssuranceFinding.create).toHaveBeenCalled();
    });
  });
});
