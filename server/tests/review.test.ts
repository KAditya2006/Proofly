import request from 'supertest';
import express from 'express';
import reviewRoutes from '../src/routes/reviewRoutes';
import ESGRecord from '../src/models/ESGRecord';
import Project from '../src/models/Project';

const app = express();
app.use(express.json());
app.use('/api/reviews', reviewRoutes);

jest.mock('../src/models/ESGRecord');
jest.mock('../src/models/Project');
jest.mock('../src/models/ReportingPeriod', () => ({
  default: {
    findById: jest.fn().mockResolvedValue({ status: 'OPEN' })
  },
  __esModule: true
}));
jest.mock('../src/utils/auditLogger', () => ({
  logAudit: jest.fn().mockResolvedValue(true)
}));

// Mock Auth Middleware
jest.mock('../src/middleware/authMiddleware', () => ({
  protect: (req: any, res: any, next: any) => {
    req.user = { _id: 'reviewer1', role: 'BUSINESS_UNIT_REVIEWER', organizationId: 'bu1' };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => next()
}));

describe('Review & Approval Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPendingReviews', () => {
    it('should fetch pending reviews for a reviewer', async () => {
      (Project.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: 'p1' }])
      });

      (ESGRecord.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([
                  { _id: 'rec1', status: 'SUBMITTED' }
                ])
              })
            })
          })
        })
      });

      const res = await request(app).get('/api/reviews').set('Authorization', 'Bearer dummy_token');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toBe('SUBMITTED');
    });
  });

  describe('approveSubmission', () => {
    it('should change status to APPROVED', async () => {
      const mockRecord: any = {
        _id: '507f1f77bcf86cd799439011',
        status: 'SUBMITTED',
        projectId: 'p1',
        save: jest.fn().mockResolvedValue(true)
      };

      (ESGRecord.findById as jest.Mock).mockResolvedValue(mockRecord);
      (Project.findById as jest.Mock).mockResolvedValue({ _id: 'p1', businessUnitId: 'bu1' });

      const res = await request(app).post('/api/reviews/507f1f77bcf86cd799439011/approve').set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
      expect(mockRecord.status).toBe('APPROVED');
      expect(mockRecord.save).toHaveBeenCalled();
    });
  });

  describe('requestCorrection', () => {
    it('should change status to CORRECTION_REQUIRED with a reason', async () => {
      const mockRecord: any = {
        _id: 'rec1',
        status: 'SUBMITTED',
        projectId: 'p1',
        save: jest.fn().mockResolvedValue(true)
      };

      (ESGRecord.findById as jest.Mock).mockResolvedValue(mockRecord);
      (Project.findById as jest.Mock).mockResolvedValue({ _id: 'p1', businessUnitId: 'bu1' });

      const res = await request(app)
        .post('/api/reviews/rec1/correction')
        .set('Authorization', 'Bearer token')
        .send({ reason: 'Invalid data' });
      
      expect(res.status).toBe(200);
      expect(mockRecord.status).toBe('CORRECTION_REQUIRED');
      expect(mockRecord.correctionReason).toBe('Invalid data');
      expect(mockRecord.save).toHaveBeenCalled();
    });

    it('should fail if no reason is provided', async () => {
      const res = await request(app)
        .post('/api/reviews/rec1/correction')
        .set('Authorization', 'Bearer token')
        .send({}); // No reason
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Correction reason is required');
    });
  });
});
