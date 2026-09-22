import request from 'supertest';
import express from 'express';
import { protect, authorize } from '../src/middleware/authMiddleware';
import integrationRoutes from '../src/routes/integrationRoutes';
import Integration from '../src/models/Integration';
import { ImportService } from '../src/services/importService';
import { AppError } from '../src/middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/integrations', integrationRoutes);

// Error handler to catch AppError
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, code: err.errorCode });
  }
  res.status(500).json({ message: 'Server error' });
});

jest.mock('../src/models/Integration');
jest.mock('../src/services/importService');

jest.mock('../src/middleware/authMiddleware', () => ({
  protect: (req: any, res: any, next: any) => {
    req.user = { _id: 'admin1', role: 'ADMIN' };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => next()
}));

describe('Integrations & Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getIntegrations', () => {
    it('should return all integrations', async () => {
      (Integration.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ _id: 'int1', name: 'SAP' }])
      });

      const res = await request(app).get('/api/integrations');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe('getIntegration', () => {
    it('should return 404 if not found', async () => {
      (Integration.findById as jest.Mock).mockResolvedValue(null);
      const res = await request(app).get('/api/integrations/missing');
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Integration not found');
    });
  });

  describe('syncIntegration', () => {
    it('should trigger sync and return batch', async () => {
      (ImportService.runSync as jest.Mock).mockResolvedValue({ _id: 'batch1' });
      const res = await request(app).post('/api/integrations/int1/sync');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Sync completed');
      expect(res.body.batch._id).toBe('batch1');
      expect(ImportService.runSync).toHaveBeenCalledWith('int1', 'admin1');
    });
  });
});
