import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import esgRecordRoutes from '../src/routes/esgRecordRoutes';
import ESGRecord from '../src/models/ESGRecord';
import User from '../src/models/User';
import Project from '../src/models/Project';

jest.mock('../src/models/ESGRecord');
jest.mock('../src/models/User');
jest.mock('../src/models/Project');
jest.mock('../src/models/ReportingPeriod', () => ({
  default: {
    findById: jest.fn().mockResolvedValue({ status: 'OPEN' })
  },
  __esModule: true
}));
jest.mock('../src/models/ESGIndicator', () => ({
  default: {
    findById: jest.fn().mockResolvedValue({ status: 'ACTIVE' })
  },
  __esModule: true
}));
jest.mock('../src/utils/auditLogger', () => ({ logAudit: jest.fn() }));

const app = express();
app.use(express.json());

// Mock auth middleware to set req.user directly
app.use((req: any, res, next) => {
  req.user = { _id: 'po123', role: 'PROJECT_OFFICER', organizationId: 'org123' };
  next();
});

// Avoid actual jwt verification since we mock user middleware directly for auth
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({ id: 'po123' }),
}));

app.use('/api/esg', esgRecordRoutes);

describe('ESG Data Engine Tests (Mocked DB)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch ESG records', async () => {
    (Project.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'p1' }])
    });

    (ESGRecord.countDocuments as jest.Mock).mockResolvedValue(1);

    (ESGRecord.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([
                    { _id: 'esg1', projectId: 'p1', indicatorId: 'ind1', value: 100, status: 'DRAFT' }
                  ])
                })
              })
            })
          })
        })
      })
    });

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'po123', role: 'PROJECT_OFFICER', organizationId: 'org123' })
    });

    const res = await request(app)
      .get('/api/esg')
      .set('Authorization', 'Bearer dummy_token');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('DRAFT');
  });

  it('should create an ESG record', async () => {
    const mockRecord: any = {
      _id: 'esg1',
      projectId: 'p1',
      indicatorId: 'ind1',
      period: '2025-Q1',
      value: 500,
      status: 'DRAFT',
      toObject: jest.fn().mockReturnValue({})
    };
    mockRecord.save = jest.fn().mockResolvedValue(mockRecord);

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'po123', role: 'PROJECT_OFFICER', organizationId: 'org123' })
    });

    (Project.findById as jest.Mock).mockResolvedValue({ 
      _id: new mongoose.Types.ObjectId().toString(),
      assignedOfficers: ['po123']
    });

    (ESGRecord.findOne as jest.Mock).mockResolvedValue(null);
    
    (ESGRecord as unknown as jest.Mock).mockImplementation(function() {
      return mockRecord;
    });

    const res = await request(app)
      .post('/api/esg')
      .set('Authorization', 'Bearer dummy_token')
      .send({ projectId: new mongoose.Types.ObjectId().toString(), indicatorId: new mongoose.Types.ObjectId().toString(), reportingPeriodId: new mongoose.Types.ObjectId().toString(), value: 500, unit: 'kWh' });

    expect(res.status).toBe(201);
  });
});
