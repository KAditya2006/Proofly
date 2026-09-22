import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import authRoutes from '../src/routes/authRoutes';
import User from '../src/models/User';
import bcrypt from 'bcryptjs';

// Mock User model
jest.mock('../src/models/User');
// Mock audit logger
jest.mock('../src/utils/auditLogger', () => ({
  logAudit: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

process.env.JWT_SECRET = 'testsecret';

describe('Authentication & Authorization Tests (Mocked DB)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login a user with valid credentials', async () => {
    const mockUser = {
      _id: '12345',
      name: 'Test User',
      email: 'test@meil.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'PROJECT_OFFICER',
      status: 'ACTIVE',
      isEmailVerified: true,
      organizationId: new mongoose.Types.ObjectId().toString(),
    };

    (User.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@meil.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.email).toBe('test@meil.com');
  });

  it('should fail login with non-existent email', async () => {
    (User.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null)
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notfound@meil.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should deny access without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should deny access with malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_token_here');

    expect(res.status).toBe(401);
  });
});
