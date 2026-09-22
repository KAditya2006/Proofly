import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getConsolidatedKPIs, getLineage } from '../src/services/consolidationService';
import Organization from '../src/models/Organization';
import Project from '../src/models/Project';
import ESGRecord from '../src/models/ESGRecord';
import ESGIndicator from '../src/models/ESGIndicator';
import ReportingPeriod from '../src/models/ReportingPeriod';
import Evidence from '../src/models/Evidence';
import User from '../src/models/User';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esg360');
    console.log('Connected to DB', Evidence.modelName, User.modelName);

    // Clean up before starting
    await Organization.deleteMany({ code: { $in: ['GRP_C', 'SUB_C', 'BU_C1', 'BU_C2'] } });
    await Project.deleteMany({ projectCode: { $in: ['P_C1', 'P_C2', 'P_C3'] } });
    await ESGIndicator.deleteMany({ code: { $in: ['I_C1', 'I_C2'] } });
    await ReportingPeriod.deleteMany({ name: 'FY25_Cons' });
    
    // Setup Mock Hierarchy
    const group = await Organization.create({ name: 'Group_Cons', type: 'GROUP', code: 'GRP_C' });
    const sub = await Organization.create({ name: 'Sub_Cons', type: 'SUBSIDIARY', parentId: group._id, code: 'SUB_C' });
    const bu1 = await Organization.create({ name: 'BU_Cons1', type: 'BUSINESS_UNIT', parentId: sub._id, code: 'BU_C1' });
    const bu2 = await Organization.create({ name: 'BU_Cons2', type: 'BUSINESS_UNIT', parentId: sub._id, code: 'BU_C2' });

    const p1 = await Project.create({ name: 'Proj1', projectCode: 'P_C1', organizationId: bu1._id, location: 'Loc', sector: 'Sec' });
    const p2 = await Project.create({ name: 'Proj2', projectCode: 'P_C2', organizationId: bu1._id, location: 'Loc', sector: 'Sec' });
    const p3 = await Project.create({ name: 'Proj3', projectCode: 'P_C3', organizationId: bu2._id, location: 'Loc', sector: 'Sec' });

    const period = await ReportingPeriod.create({ name: 'FY25_Cons', financialYear: '2025-2026', startDate: new Date(), endDate: new Date(), status: 'OPEN' });
    const ind1 = await ESGIndicator.create({ name: 'Ind_Cons', code: 'I_C1', unit: 'kWh', category: 'ENVIRONMENT', dataType: 'NUMBER', aggregationMethod: 'SUM' });

    await ESGRecord.syncIndexes();

    // Create Base Record
    const payload = { indicatorId: ind1._id, projectId: p1._id, reportingPeriodId: period._id, value: 100, unit: 'kWh', status: 'APPROVED' as 'APPROVED', organizationId: bu1._id, createdBy: new mongoose.Types.ObjectId() };
    await ESGRecord.create(payload);
    
    let duplicateError = false;
    try {
      await ESGRecord.create(payload);
    } catch (e: any) {
      if (e.code === 11000) duplicateError = true;
    }
    console.log('Duplicate prevention works?', duplicateError);

    // Create remaining records
    await ESGRecord.create({ ...payload, projectId: p2._id, value: 200, organizationId: bu1._id });
    await ESGRecord.create({ ...payload, projectId: p3._id, value: 300, organizationId: bu2._id });
    
    // Create DRAFT record which should be ignored (on p1)
    await ESGRecord.create({ ...payload, projectId: p1._id, indicatorId: (await ESGIndicator.create({ name: 'Ind2', code: 'I_C2', unit: 'kWh', category: 'ENVIRONMENT', dataType: 'NUMBER', aggregationMethod: 'SUM' }))._id, value: 9999, status: 'DRAFT' as 'DRAFT' });

    // Test BU1 Scope
    const bu1Res = await getConsolidatedKPIs({ reportingPeriodId: period._id.toString(), scopeLevel: 'BUSINESS_UNIT', scopeId: bu1._id.toString() });
    console.log('BU1 Sum (Expect 300):', bu1Res.find(r => r?.indicator._id.toString() === ind1._id.toString())?.value);

    // Test Sub Scope
    const subRes = await getConsolidatedKPIs({ reportingPeriodId: period._id.toString(), scopeLevel: 'SUBSIDIARY', scopeId: sub._id.toString() });
    console.log('Sub Sum (Expect 600):', subRes.find(r => r?.indicator._id.toString() === ind1._id.toString())?.value);

    // Test Lineage
    const lineage = await getLineage(ind1._id.toString(), { reportingPeriodId: period._id.toString(), scopeLevel: 'SUBSIDIARY', scopeId: sub._id.toString() });
    console.log('Lineage Length (Expect 3 records for Sub):', lineage.length);

    // Clean up
    await Organization.deleteMany({ _id: { $in: [group._id, sub._id, bu1._id, bu2._id] } });
    await Project.deleteMany({ _id: { $in: [p1._id, p2._id, p3._id] } });
    await ESGRecord.deleteMany({ indicatorId: ind1._id });
    await ESGIndicator.findByIdAndDelete(ind1._id);
    await ReportingPeriod.findByIdAndDelete(period._id);
    
    console.log('Test complete and cleaned up');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
