import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import User from '../src/models/User';
import Organization from '../src/models/Organization';
import Project from '../src/models/Project';
import ReportingPeriod from '../src/models/ReportingPeriod';
import ESGIndicator from '../src/models/ESGIndicator';

import authRoutes from '../src/routes/authRoutes';
import userRoutes from '../src/routes/userRoutes';
import organizationRoutes from '../src/routes/organizationRoutes';
import projectRoutes from '../src/routes/projectRoutes';
import reportingRoutes from '../src/routes/reportingRoutes';
import indicatorRoutes from '../src/routes/indicatorRoutes';
import { AppError } from '../src/middleware/errorHandler';

// Need to define mongoose models for things that might use mongoose.model(...)
jest.mock('../src/models/User');
jest.mock('../src/models/Organization', () => {
  const m = {
    findById: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };
  return m;
});
mongoose.model = jest.fn().mockReturnValue({
  findById: jest.fn(),
});
jest.mock('../src/models/Project');
jest.mock('../src/models/ReportingPeriod');
jest.mock('../src/models/ESGIndicator');
jest.mock('../src/utils/auditLogger', () => ({ logAudit: jest.fn() }));

const app = express();
app.use(express.json());

// Fake Auth Middleware
app.use((req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  
  if (token === 'admin_token') {
    req.user = { _id: 'admin_user', role: 'ADMIN' };
  } else if (token === 'officer_token') {
    req.user = { _id: 'officer_user', role: 'PROJECT_OFFICER' };
  }
  next();
});

import { protect, authorize } from '../src/middleware/authMiddleware';
jest.mock('../src/middleware/authMiddleware', () => ({
  protect: (req: any, res: any, next: any) => next(),
  authorize: (...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      next();
    };
  }
}));

app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reporting-periods', reportingRoutes);
app.use('/api/indicators', indicatorRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, error: { code: err.errorCode } });
  }
  res.status(500).json({ message: 'Server error' });
});

describe('Admin / Master Data Workflow Audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Management', () => {
    it('should block non-admins from creating a user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer officer_token`)
        .send({ name: 'New Guy', email: 'new@meil.com', employeeId: 'EMP-123', password: 'password123', role: 'BUSINESS_UNIT_REVIEWER', mobileNo: '1234567890' });
      expect(res.status).toBe(403);
    });

    it('should allow admins to create a user', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({ _id: 'new_user', email: 'new@meil.com', name: 'New Guy', role: 'BUSINESS_UNIT_REVIEWER', toJSON: () => ({ email: 'new@meil.com' }) });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer admin_token`)
        .send({ name: 'New Guy', email: 'new@meil.com', employeeId: 'EMP-123', password: 'password123', role: 'BUSINESS_UNIT_REVIEWER', mobileNo: '1234567890' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('new@meil.com');
    });

    it('should allow admins to update a user role', async () => {
      const mockUser: any = { _id: 'u1', role: 'PROJECT_OFFICER', save: jest.fn() };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .put('/api/users/u1')
        .set('Authorization', `Bearer admin_token`)
        .send({ role: 'BUSINESS_UNIT_REVIEWER' });
      
      expect(res.status).toBe(200);
      expect(mockUser.role).toBe('BUSINESS_UNIT_REVIEWER');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('Organization Hierarchy', () => {
    it('should block non-admins from creating an organization', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer officer_token`)
        .send({ name: 'Sub', type: 'SUBSIDIARY', parentId: 'group1' });
      expect(res.status).toBe(403);
    });

    it('should enforce hierarchy: SUBSIDIARY must have GROUP parent', async () => {
      // mongoose.model is mocked to return an object with findById
      const m = mongoose.model('Organization');
      (m.findById as jest.Mock).mockResolvedValue({ _id: 'sub1', type: 'SUBSIDIARY' });
      (Organization.findById as jest.Mock).mockResolvedValue({ _id: 'sub1', type: 'SUBSIDIARY' });

      const res = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer admin_token`)
        .send({ name: 'Sub2', type: 'SUBSIDIARY', parentId: 'sub1' });
      
      expect(res.status).toBe(400); 
    });

    it('should allow admins to create organization successfully', async () => {
      const m = mongoose.model('Organization');
      (m.findById as jest.Mock).mockResolvedValue({ _id: 'g1', type: 'GROUP' });
      (Organization.findById as jest.Mock).mockResolvedValue({ _id: 'g1', type: 'GROUP' });
      (Organization.create as jest.Mock).mockResolvedValue({ _id: 's1', type: 'SUBSIDIARY' });

      const res = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer admin_token`)
        .send({ name: 'New Sub', type: 'SUBSIDIARY', parentId: 'g1', code: 'NEW_SUB' });
      
      console.log(res.body);
      expect(res.status).toBe(201);
    });
  });

  describe('Project Master', () => {
    it('should block non-admins from creating a project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer officer_token`)
        .send({ name: 'Proj A', projectCode: 'PA', organizationId: 'o1', location: 'HQ', sector: 'Tech' });
      expect(res.status).toBe(403);
    });

    it('should allow admins to create a project', async () => {
      (Project.findOne as jest.Mock).mockResolvedValue(null);
      const m = mongoose.model('Organization');
      (m.findById as jest.Mock).mockResolvedValue({ _id: 'o1', type: 'BUSINESS_UNIT' });
      (Organization.findById as jest.Mock).mockResolvedValue({ _id: 'o1', type: 'BUSINESS_UNIT' });
      (Project.create as jest.Mock).mockResolvedValue({ _id: 'p1', projectCode: 'PA' });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer admin_token`)
        .send({ name: 'Proj A', projectCode: 'PA', organizationId: 'o1', location: 'HQ', sector: 'Tech' });
      
      expect(res.status).toBe(201);
    });
  });

  describe('Reporting Period Lifecycle', () => {
    it('should prevent overlapping/duplicate financial years', async () => {
      (ReportingPeriod.findOne as jest.Mock).mockResolvedValue({ _id: 'rp1', financialYear: '2023-2024' });

      const res = await request(app)
        .post('/api/reporting-periods')
        .set('Authorization', `Bearer admin_token`)
        .send({ name: 'Another FY23-24', financialYear: '2023-2024', startDate: '2023-04-01', endDate: '2024-03-31' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('DUPLICATE_FY');
    });
  });

  describe('ESG Indicator Master', () => {
    it('should prevent duplicate indicator codes', async () => {
      (ESGIndicator.findOne as jest.Mock).mockResolvedValue({ _id: 'i1', code: 'E1' });

      const res = await request(app)
        .post('/api/indicators')
        .set('Authorization', `Bearer admin_token`)
        .send({ code: 'E1', name: 'Other Emissions', category: 'ENVIRONMENT', unit: 'kg', dataType: 'NUMBER' });
        
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('DUPLICATE_CODE');
    });
  });
});
