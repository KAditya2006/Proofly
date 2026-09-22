import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../src/models/Project';
import Organization from '../src/models/Organization';
import ReportingPeriod from '../src/models/ReportingPeriod';
import ESGIndicator from '../src/models/ESGIndicator';
import ESGRecord from '../src/models/ESGRecord';
import BRSRCoreConfig from '../src/models/BRSRCoreConfig';
import ValueChainPartner from '../src/models/ValueChainPartner';
import { calculateReadiness } from '../src/services/readinessService';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esg360');
    console.log('Connected to DB', ValueChainPartner.modelName);

    // Clean up before starting
    await Organization.deleteMany({ code: { $in: ['READ_GRP', 'READ_SUB', 'READ_BU'] } });
    await Project.deleteMany({ projectCode: { $in: ['READ_P1', 'READ_P2'] } });
    await ESGIndicator.updateMany({}, { $set: { mandatory: false } }); // Isolate test
    await ESGIndicator.deleteMany({ code: { $in: ['READ_I1', 'READ_I2'] } });
    await ReportingPeriod.deleteMany({ name: { $in: ['READ_FY25', 'READ_FY26'] } });
    await ESGRecord.deleteMany({ comments: 'READ_TEST' });
    await BRSRCoreConfig.deleteMany({ attributeName: 'READ_TEST_ATTR' });

    // 1. Setup Hierarchy
    const group = await Organization.create({ name: 'READ Group', code: 'READ_GRP', type: 'GROUP' });
    const sub = await Organization.create({ name: 'READ Sub', code: 'READ_SUB', type: 'SUBSIDIARY', parentId: group._id });
    const bu = await Organization.create({ name: 'READ BU', code: 'READ_BU', type: 'BUSINESS_UNIT', parentId: sub._id });

    // 2. Setup Projects
    const p1 = await Project.create({ name: 'READ Proj 1', projectCode: 'READ_P1', organizationId: bu._id, status: 'ACTIVE', sector: 'IT', location: 'India' });
    const p2 = await Project.create({ name: 'READ Proj 2', projectCode: 'READ_P2', organizationId: bu._id, status: 'ACTIVE', sector: 'IT', location: 'India' });

    // 3. Setup Indicators (1 Mandatory with mapping, 1 Optional)
    const i1 = await ESGIndicator.create({
      code: 'READ_I1', name: 'Required Ind', category: 'ENVIRONMENT', unit: 'MWh', dataType: 'NUMBER',
      mandatory: true, aggregationMethod: 'SUM', status: 'ACTIVE',
      brsrMappings: [{ section: 'A', principle: 'P1', disclosure: 'Req Data' }]
    });

    const i2 = await ESGIndicator.create({
      code: 'READ_I2', name: 'Optional Ind', category: 'SOCIAL', unit: 'Count', dataType: 'NUMBER',
      mandatory: false, aggregationMethod: 'SUM', status: 'ACTIVE'
    });

    // 4. Setup Reporting Periods (to test isolation)
    const rp1 = await ReportingPeriod.create({ name: 'READ_FY25', financialYear: '2024-2025', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), status: 'OPEN' });
    const rp2 = await ReportingPeriod.create({ name: 'READ_FY26', financialYear: '2025-2026', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'), status: 'OPEN' });

    // 5. BRSR Core config
    const core = await BRSRCoreConfig.create({
      attributeName: 'READ_TEST_ATTR',
      description: 'Test Core',
      indicatorIds: [i1._id],
      status: 'ACTIVE'
    });

    // Test Scenario A: No records yet
    let readiness = await calculateReadiness(rp1._id.toString(), [p1._id, p2._id]);
    console.log(`Scenario A (0/2 mandatory expected) - Data: ${readiness.dataCompleteness}%, Appr: ${readiness.approval}%`);

    // Test Scenario B: 1 DRAFT, 1 SUBMITTED (Should still be 0%)
    await ESGRecord.create([
      { projectId: p1._id, indicatorId: i1._id, reportingPeriodId: rp1._id, status: 'DRAFT', value: 100, comments: 'READ_TEST', createdBy: p1._id, unit: 'MWh', organizationId: bu._id },
      { projectId: p2._id, indicatorId: i1._id, reportingPeriodId: rp1._id, status: 'SUBMITTED', value: 200, comments: 'READ_TEST', createdBy: p2._id, unit: 'MWh', organizationId: bu._id }
    ]);
    
    readiness = await calculateReadiness(rp1._id.toString(), [p1._id, p2._id]);
    console.log(`Scenario B (DRAFT/SUBMITTED injected) - Data: ${readiness.dataCompleteness}%, Appr: ${readiness.approval}%`);

    // Test Scenario C: Approve the records
    await ESGRecord.updateMany({ comments: 'READ_TEST' }, { $set: { status: 'APPROVED' } });
    readiness = await calculateReadiness(rp1._id.toString(), [p1._id, p2._id]);
    console.log(`Scenario C (APPROVED) - Data: ${readiness.dataCompleteness}%, Appr: ${readiness.approval}%`);

    // Test Scenario D: Cross Period Leakage (Add an approved record to FY26)
    await ESGRecord.create([
      { projectId: p1._id, indicatorId: i1._id, reportingPeriodId: rp2._id, status: 'APPROVED', value: 300, comments: 'READ_TEST', createdBy: p1._id, unit: 'MWh', organizationId: bu._id }
    ]);
    const readinessFY26 = await calculateReadiness(rp2._id.toString(), [p1._id, p2._id]);
    console.log(`Scenario D (FY26 Isolation - expect 50%) - Data: ${readinessFY26.dataCompleteness}%`);

    // Test Scenario E: Optional Indicators don't mess up math
    await ESGRecord.create([
      { projectId: p1._id, indicatorId: i2._id, reportingPeriodId: rp1._id, status: 'APPROVED', value: 50, comments: 'READ_TEST', createdBy: p1._id, unit: 'Count', organizationId: bu._id }
    ]);
    const readinessWithOptional = await calculateReadiness(rp1._id.toString(), [p1._id, p2._id]);
    console.log(`Scenario E (Added optional record) - Data: ${readinessWithOptional.dataCompleteness}% (Should remain unchanged from Scenario C)`);

    // Cleanup
    await Organization.deleteMany({ code: { $in: ['READ_GRP', 'READ_SUB', 'READ_BU'] } });
    await Project.deleteMany({ projectCode: { $in: ['READ_P1', 'READ_P2'] } });
    await ESGIndicator.deleteMany({ code: { $in: ['READ_I1', 'READ_I2'] } });
    await ReportingPeriod.deleteMany({ name: { $in: ['READ_FY25', 'READ_FY26'] } });
    await ESGRecord.deleteMany({ comments: 'READ_TEST' });
    await BRSRCoreConfig.deleteMany({ attributeName: 'READ_TEST_ATTR' });
    
    console.log('Test complete and cleaned up');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
