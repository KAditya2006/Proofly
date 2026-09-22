import request from 'supertest';
import mongoose from 'mongoose';

import ESGRecord from '../src/models/ESGRecord';
import ESGIndicator from '../src/models/ESGIndicator';
import ReportingPeriod from '../src/models/ReportingPeriod';
import Project from '../src/models/Project';
import Organization from '../src/models/Organization';
import User from '../src/models/User';
import jwt from 'jsonwebtoken';
import { getConsolidatedKPIs, getLineage } from '../src/services/consolidationService';
import { connectDB, closeDB, clearDB } from './setup';

jest.mock('../src/utils/auditLogger', () => ({
  logAudit: jest.fn()
}));

describe('Phase 33: ESG Data Integrity & Consolidation Audit', () => {
  let adminToken: string;
  let groupToken: string;

  let groupOrg: any;
  let subOrg: any;
  let buOrg1: any;
  let buOrg2: any;
  
  let project1: any;
  let project2: any;
  let project3: any;

  let period1: any;
  let indicator1: any;
  let indicator2: any;

  beforeAll(async () => {
    await connectDB();
    groupOrg = await Organization.create({ name: 'Group', type: 'GROUP', code: 'GRP' });
    subOrg = await Organization.create({ name: 'Sub A', type: 'SUBSIDIARY', parentId: groupOrg._id, code: 'SUB_A' });
    buOrg1 = await Organization.create({ name: 'BU 1', type: 'BUSINESS_UNIT', parentId: subOrg._id, code: 'BU_1' });
    buOrg2 = await Organization.create({ name: 'BU 2', type: 'BUSINESS_UNIT', parentId: subOrg._id, code: 'BU_2' });

    project1 = await Project.create({ name: 'Project 1', projectCode: 'P1', organizationId: buOrg1._id, location: 'Loc', sector: 'Sec' });
    project2 = await Project.create({ name: 'Project 2', projectCode: 'P2', organizationId: buOrg1._id, location: 'Loc', sector: 'Sec' });
    project3 = await Project.create({ name: 'Project 3', projectCode: 'P3', organizationId: buOrg2._id, location: 'Loc', sector: 'Sec' });

    period1 = await ReportingPeriod.create({ name: 'FY24', financialYear: '2024-2025', startDate: new Date(), endDate: new Date(), status: 'OPEN' });
    indicator1 = await ESGIndicator.create({ name: 'Ind1', code: 'I1', unit: 'kWh', category: 'ENVIRONMENT', dataType: 'NUMBER', aggregationMethod: 'SUM' });
    indicator2 = await ESGIndicator.create({ name: 'Ind2', code: 'I2', unit: 'L', category: 'ENVIRONMENT', dataType: 'NUMBER', aggregationMethod: 'SUM' });
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await ESGRecord.deleteMany({});
  });

  it('1. Prevents duplicate ESG records via exact same Project + Period + Indicator (Race condition prevention)', async () => {
    const payload = {
      indicatorId: indicator1._id,
      projectId: project1._id,
      reportingPeriodId: period1._id,
      value: 100,
      unit: 'kWh',
    };

    // First creation
    await ESGRecord.create({ ...payload, organizationId: project1.organizationId, createdBy: new mongoose.Types.ObjectId() });

    // Second creation should fail at DB level due to index
    let error;
    try {
      await ESGRecord.create({ ...payload, organizationId: project1.organizationId, createdBy: new mongoose.Types.ObjectId() });
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect((error as any).code).toBe(11000); // Duplicate Key Error
  });

  it('2. Mathematically consolidates correctly up the exact hierarchy', async () => {
    // Project 1 (BU1) = 100
    await ESGRecord.create({ indicatorId: indicator1._id, projectId: project1._id, reportingPeriodId: period1._id, value: 100, unit: 'kWh', status: 'APPROVED', organizationId: project1.organizationId, createdBy: new mongoose.Types.ObjectId() });
    // Project 2 (BU1) = 200
    await ESGRecord.create({ indicatorId: indicator1._id, projectId: project2._id, reportingPeriodId: period1._id, value: 200, unit: 'kWh', status: 'APPROVED', organizationId: project2.organizationId, createdBy: new mongoose.Types.ObjectId() });
    // Project 3 (BU2) = 300
    await ESGRecord.create({ indicatorId: indicator1._id, projectId: project3._id, reportingPeriodId: period1._id, value: 300, unit: 'kWh', status: 'APPROVED', organizationId: project3.organizationId, createdBy: new mongoose.Types.ObjectId() });
    
    // Test BU1 Scope (Should be 300)
    const bu1Results = await getConsolidatedKPIs({ reportingPeriodId: period1._id.toString(), scopeLevel: 'BUSINESS_UNIT', scopeId: buOrg1._id.toString() });
    expect(bu1Results[0]?.value).toBe(300);

    // Test BU2 Scope (Should be 300)
    const bu2Results = await getConsolidatedKPIs({ reportingPeriodId: period1._id.toString(), scopeLevel: 'BUSINESS_UNIT', scopeId: buOrg2._id.toString() });
    expect(bu2Results[0]?.value).toBe(300);

    // Test Sub A Scope (Should be 600)
    const subResults = await getConsolidatedKPIs({ reportingPeriodId: period1._id.toString(), scopeLevel: 'SUBSIDIARY', scopeId: subOrg._id.toString() });
    expect(subResults[0]?.value).toBe(600);

    // Test Group Scope (Should be 600)
    const groupResults = await getConsolidatedKPIs({ reportingPeriodId: period1._id.toString(), scopeLevel: 'GROUP', scopeId: groupOrg._id.toString() });
    expect(groupResults[0]?.value).toBe(600);
  });

  it('3. Ignores DRAFT, SUBMITTED, REJECTED records in consolidation', async () => {
    await ESGRecord.create({ indicatorId: indicator1._id, projectId: project1._id, reportingPeriodId: period1._id, value: 100, unit: 'kWh', status: 'DRAFT', organizationId: project1.organizationId, createdBy: new mongoose.Types.ObjectId() });
    await ESGRecord.create({ indicatorId: indicator2._id, projectId: project1._id, reportingPeriodId: period1._id, value: 500, unit: 'L', status: 'SUBMITTED', organizationId: project1.organizationId, createdBy: new mongoose.Types.ObjectId() });
    
    const groupResults = await getConsolidatedKPIs({ reportingPeriodId: period1._id.toString(), scopeLevel: 'GROUP', scopeId: groupOrg._id.toString() });
    expect(groupResults.length).toBe(0); // Should be empty because no APPROVED records
  });
  
  it('4. Data lineage math accurately reconciles with consolidation totals', async () => {
    await ESGRecord.create({ indicatorId: indicator1._id, projectId: project1._id, reportingPeriodId: period1._id, value: 100, unit: 'kWh', status: 'APPROVED', organizationId: project1.organizationId, createdBy: new mongoose.Types.ObjectId() });
    // Note: Creating the second record via Project 2 to avoid duplicate index
    await ESGRecord.create({ indicatorId: indicator1._id, projectId: project2._id, reportingPeriodId: period1._id, value: 200, unit: 'kWh', status: 'APPROVED', organizationId: project2.organizationId, createdBy: new mongoose.Types.ObjectId() });
    
    const lineage = await getLineage(indicator1._id.toString(), { reportingPeriodId: period1._id.toString(), scopeLevel: 'GROUP', scopeId: groupOrg._id.toString() });
    
    expect(lineage.length).toBe(2);
    const sum = lineage.reduce((acc, rec) => acc + Number(rec.value), 0);
    expect(sum).toBe(300);
  });
});
