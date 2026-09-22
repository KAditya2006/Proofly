import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
import authRoutes from '../src/routes/authRoutes';
import esgRecordRoutes from '../src/routes/esgRecordRoutes';

// Mock mongoose to avoid actual DB connections during basic API routing tests
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      readyState: 1,
      dropDatabase: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true),
    }
  };
});

// Load environment variables for test
dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/esg/records', esgRecordRoutes);

describe('End-to-End API Workflows', () => {
  jest.setTimeout(30000); // 30 seconds to allow for DB connection

  beforeAll(async () => {
    try {
      // Connect to a test database
      if (process.env.MONGO_URI) {
        await mongoose.connect(process.env.MONGO_URI);
      } else {
        await mongoose.connect('mongodb://localhost:27017/meil_esg_test');
      }
    } catch (error) {
      console.error('Test DB connection failed:', error);
    }
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
      }
    } catch (error) {
      console.error('Test DB disconnection failed:', error);
    }
  });

  it('should return 401 when accessing protected route without token', async () => {
    const res = await request(app).get('/api/esg/records');
    expect(res.status).toBe(401);
  });

  // Additional mock-based workflows can be added here
  // For true E2E, we would seed a test database and run the exact queries
});
