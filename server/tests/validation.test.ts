import { validateRecord } from '../src/utils/validationEngine';
import ESGIndicator from '../src/models/ESGIndicator';
import { IESGRecord } from '../src/models/ESGRecord';
import mongoose from 'mongoose';

jest.mock('../src/models/ESGIndicator');

describe('Validation Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getValidRecord = (): IESGRecord => ({
    _id: new mongoose.Types.ObjectId(),
    projectId: new mongoose.Types.ObjectId(),
    reportingPeriodId: new mongoose.Types.ObjectId(),
    indicatorId: new mongoose.Types.ObjectId(),
    value: 100,
    unit: 'kWh',
    status: 'DRAFT',
    evidenceIds: [new mongoose.Types.ObjectId()]
  } as unknown as IESGRecord);

  it('should pass validation for a valid numeric record', async () => {
    (ESGIndicator.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      dataType: 'NUMBER',
      unit: 'kWh'
    });

    const record = getValidRecord();
    const result = await validateRecord(record);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should fail if missing required fields', async () => {
    const record = getValidRecord();
    record.projectId = null as any;

    const result = await validateRecord(record);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Project is required.');
  });

  it('should fail if numeric value is negative', async () => {
    (ESGIndicator.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      dataType: 'NUMBER',
      unit: 'kWh'
    });

    const record = getValidRecord();
    record.value = -10;

    const result = await validateRecord(record);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Numeric value cannot be negative unless specified.');
  });

  it('should fail if unit does not match indicator', async () => {
    (ESGIndicator.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      dataType: 'NUMBER',
      unit: 'Liters'
    });

    const record = getValidRecord();
    const result = await validateRecord(record);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Unit must be Liters. Received: kWh');
  });

  it('should fail if numeric indicator has no evidence', async () => {
    (ESGIndicator.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      dataType: 'NUMBER',
      unit: 'kWh'
    });

    const record = getValidRecord();
    record.evidenceIds = [];

    const result = await validateRecord(record);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Evidence is required for numeric indicators.');
  });
});
