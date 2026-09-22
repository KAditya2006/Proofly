import request from 'supertest';
import express from 'express';
import evidenceRoutes from '../src/routes/evidenceRoutes';
import Evidence from '../src/models/Evidence';
import ESGRecord from '../src/models/ESGRecord';
import fs from 'fs';

jest.mock('../src/models/Evidence');
jest.mock('../src/models/ESGRecord');
jest.mock('fs');
jest.mock('../src/utils/auditLogger', () => ({
  logAudit: jest.fn().mockResolvedValue(true)
}));
jest.mock('../src/utils/hierarchy', () => ({
  getAuthorizedProjectIds: jest.fn().mockResolvedValue(['proj1', 'proj2'])
}));

const app = express();
app.use(express.json());
app.use('/api/evidence', evidenceRoutes);

// Mock Auth Middleware
jest.mock('../src/middleware/authMiddleware', () => ({
  protect: (req: any, res: any, next: any) => {
    req.user = { _id: '507f1f77bcf86cd799439013', role: 'PROJECT_OFFICER' };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => next()
}));

describe('Evidence Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteEvidence', () => {
    it('should delete evidence if not locked by a submitted/approved record', async () => {
      const mockEvidence: any = {
        _id: '507f1f77bcf86cd799439014',
        fileUrl: '/uploads/test.pdf',
        deleteOne: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({})
      };

      const mockRecord: any = {
        _id: '507f1f77bcf86cd799439015',
        status: 'DRAFT',
        evidenceIds: ['507f1f77bcf86cd799439014'],
        save: jest.fn().mockResolvedValue(true)
      };

      (Evidence.findById as jest.Mock).mockResolvedValue(mockEvidence);
      (ESGRecord.find as jest.Mock).mockResolvedValue([mockRecord]);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockReturnValue(true);

      const res = await request(app)
        .delete('/api/evidence/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(mockEvidence.deleteOne).toHaveBeenCalled();
      expect(mockRecord.save).toHaveBeenCalled();
    });

    it('should not delete evidence if linked to an APPROVED record', async () => {
      const mockEvidence: any = {
        _id: '507f1f77bcf86cd799439014',
        fileUrl: '/uploads/test.pdf'
      };

      const mockRecord: any = {
        _id: '507f1f77bcf86cd799439015',
        status: 'APPROVED',
        evidenceIds: ['507f1f77bcf86cd799439014']
      };

      (Evidence.findById as jest.Mock).mockResolvedValue(mockEvidence);
      (ESGRecord.find as jest.Mock).mockResolvedValue([mockRecord]);

      const res = await request(app)
        .delete('/api/evidence/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot delete evidence linked to a submitted or approved record');
    });
  });

  describe('getCoverage', () => {
    it('should calculate coverage correctly', async () => {
      // 10 total records, 5 have evidence -> 50%
      (ESGRecord.countDocuments as jest.Mock).mockImplementation((query) => {
        if (query['evidenceIds.0']) return Promise.resolve(5);
        return Promise.resolve(10);
      });

      const res = await request(app)
        .get('/api/evidence/coverage?reportingPeriodId=rp1')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.totalRecords).toBe(10);
      expect(res.body.recordsWithEvidence).toBe(5);
      expect(res.body.coveragePercent).toBe('50.00');
    });
  });
});
