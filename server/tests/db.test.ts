import mongoose from 'mongoose';
import ESGRecord from '../src/models/ESGRecord';
import User from '../src/models/User';

describe('Database Constraints & Integrity', () => {
  beforeAll(async () => {
    // Avoid MongooseServerSelectionError by mocking or using an in-memory DB if needed.
    // For schema validation tests, we can just use the document's validate() method synchronously without a real DB.
  });

  describe('User Schema Constraints', () => {
    it('should require name, email, and passwordHash', async () => {
      const user = new User({});
      let err: any;
      try {
        await user.validate();
      } catch (e) {
        err = e;
      }
      expect(err?.errors.name).toBeDefined();
      expect(err?.errors.email).toBeDefined();
      expect(err?.errors.passwordHash).toBeDefined();
      expect(err?.errors.role).toBeDefined();
    });
  });

  describe('ESGRecord Schema Constraints', () => {
    it('should require indicatorId, organizationId, reportingPeriodId, value, unit, createdBy', async () => {
      const record = new ESGRecord({});
      let err: any;
      try {
        await record.validate();
      } catch (e) {
        err = e;
      }
      expect(err?.errors.indicatorId).toBeDefined();
      expect(err?.errors.organizationId).toBeDefined();
      expect(err?.errors.reportingPeriodId).toBeDefined();
      expect(err?.errors.value).toBeDefined();
      expect(err?.errors.unit).toBeDefined();
      expect(err?.errors.createdBy).toBeDefined();
    });

    it('should validate status enum', async () => {
      const record = new ESGRecord({
        projectId: new mongoose.Types.ObjectId(),
        indicatorId: new mongoose.Types.ObjectId(),
        reportingPeriodId: new mongoose.Types.ObjectId(),
        status: 'INVALID_STATUS'
      });
      let err: any;
      try {
        await record.validate();
      } catch (e) {
        err = e;
      }
      expect(err?.errors.status).toBeDefined();
    });
  });
});
