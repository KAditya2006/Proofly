import request from 'supertest';
import express, { Request, Response } from 'express';
import { protect, authorize } from '../src/middleware/authMiddleware';

const app = express();
app.use(express.json());

// Dummy routes to test RBAC
app.get('/api/test/admin', protect, authorize('SUPER_ADMIN', 'ORG_ADMIN'), (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Admin access' });
});

app.get('/api/test/project', protect, authorize('PROJECT_MANAGER', 'PROJECT_OFFICER'), (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Project access' });
});

// Mock user middleware for testing without actual JWT verification
app.use((req: any, res, next) => {
  // Overridden by individual tests
  next();
});

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token) => {
    if (token === 'superadmin_token') return { id: 'sa123' };
    if (token === 'officer_token') return { id: 'po123' };
    throw new Error('Invalid token');
  }),
}));

import User from '../src/models/User';
jest.mock('../src/models/User');

describe('RBAC Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow SUPER_ADMIN to access admin route', async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'sa123', role: 'SUPER_ADMIN', status: 'ACTIVE' })
    });

    const res = await request(app)
      .get('/api/test/admin')
      .set('Authorization', 'Bearer superadmin_token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should deny PROJECT_OFFICER from accessing admin route', async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'po123', role: 'PROJECT_OFFICER', status: 'ACTIVE' })
    });

    const res = await request(app)
      .get('/api/test/admin')
      .set('Authorization', 'Bearer officer_token');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Not authorized to access this route');
  });

  it('should allow PROJECT_OFFICER to access project route', async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'po123', role: 'PROJECT_OFFICER', status: 'ACTIVE' })
    });

    const res = await request(app)
      .get('/api/test/project')
      .set('Authorization', 'Bearer officer_token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should deny SUPER_ADMIN from accessing project route if not explicitly allowed', async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'sa123', role: 'SUPER_ADMIN', status: 'ACTIVE' })
    });

    const res = await request(app)
      .get('/api/test/project')
      .set('Authorization', 'Bearer superadmin_token');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Not authorized to access this route');
  });
});
