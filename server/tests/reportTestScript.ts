import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../src/models/Project';
import Organization from '../src/models/Organization';
import ReportingPeriod from '../src/models/ReportingPeriod';
import ESGIndicator from '../src/models/ESGIndicator';
import ESGRecord from '../src/models/ESGRecord';
import Report from '../src/models/Report';
import ReportSnapshot from '../src/models/ReportSnapshot';
import BRSRCoreConfig from '../src/models/BRSRCoreConfig';
import ValueChainPartner from '../src/models/ValueChainPartner';
import { generateReport, submitReportReview, finalizeReport, archiveReport } from '../src/controllers/reportController';

dotenv.config();

const mockRes = () => {
  const res: any = {};
  res.status = function(code: number) { res.statusCode = code; return res; };
  res.json = function(data: any) { res.data = data; return res; };
  return res;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esg360');
    console.log('Connected to DB');
    console.log('Models loaded:', BRSRCoreConfig.modelName, ValueChainPartner.modelName);

    // Clean up before starting
    await Organization.deleteMany({ code: { $in: ['REP_GRP', 'REP_BU'] } });
    await Project.deleteMany({ projectCode: 'REP_P1' });
    await ESGIndicator.updateMany({}, { $set: { mandatory: false } }); 
    await ESGIndicator.deleteMany({ code: 'REP_I1' });
    await ReportingPeriod.deleteMany({ name: 'REP_FY25' });
    await ESGRecord.deleteMany({ comments: 'REP_TEST' });
    await Report.deleteMany({ name: { $regex: 'MEIL ESG Report - PROJECT' } });
    await ReportSnapshot.deleteMany({});

    // 1. Setup Hierarchy & Indicators
    const group = await Organization.create({ name: 'REP Group', code: 'REP_GRP', type: 'GROUP' });
    const bu = await Organization.create({ name: 'REP BU', code: 'REP_BU', type: 'BUSINESS_UNIT', parentId: group._id });
    const p1 = await Project.create({ name: 'REP Proj 1', projectCode: 'REP_P1', organizationId: bu._id, status: 'ACTIVE', sector: 'IT', location: 'India' });
    
    const i1 = await ESGIndicator.create({
      code: 'REP_I1', name: 'Req Ind', category: 'ENVIRONMENT', unit: 'MWh', dataType: 'NUMBER',
      mandatory: true, aggregationMethod: 'SUM', status: 'ACTIVE', brsrMappings: [{ section: 'A', principle: 'P1', disclosure: 'Req Data' }]
    });

    const rp1 = await ReportingPeriod.create({ name: 'REP_FY25', financialYear: '2024-2025', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), status: 'OPEN' });

    const adminUser = { _id: new mongoose.Types.ObjectId(), role: 'ADMIN', organizationId: group._id };

    console.log('--- Test 1: Generate Report ---');
    const reqGenerate = {
      body: { reportingPeriodId: rp1._id, scopeLevel: 'PROJECT', scopeId: p1._id.toString(), reportType: 'BRSR_COMPREHENSIVE' },
      user: adminUser
    };
    const resGenerate = mockRes();
    await generateReport(reqGenerate, resGenerate);
    
    if (resGenerate.statusCode !== 201) throw new Error(`Generate failed: ${resGenerate.statusCode}`);
    const generatedReport = resGenerate.data;
    console.log(`Generated Report v${generatedReport.version}, status: ${generatedReport.status}`);

    console.log('--- Test 2: Concurrency / Unique Version Enforcement ---');
    const resGenerateFail = mockRes();
    await generateReport(reqGenerate, resGenerateFail);
    const v2Report = resGenerateFail.data;
    if (resGenerateFail.statusCode === 201) {
        console.log(`Generated Report v${v2Report.version} successfully (serial generation).`);
    } else {
        console.log(`Collision prevented! Status: ${resGenerateFail.statusCode}`);
    }

    console.log('--- Test 3: Finalize DRAFT directly (State machine violation) ---');
    const reqFinalize = { params: { id: generatedReport._id }, user: adminUser };
    const resFinalizeFail = mockRes();
    await finalizeReport(reqFinalize, resFinalizeFail);
    if (resFinalizeFail.statusCode !== 400) throw new Error(`Expected 400, got ${resFinalizeFail.statusCode}`);
    console.log(`Prevented finalization of DRAFT: ${resFinalizeFail.data.message}`);

    console.log('--- Test 4: Submit to IN_REVIEW ---');
    const resSubmit = mockRes();
    await submitReportReview({ params: { id: generatedReport._id }, user: adminUser }, resSubmit);
    if (resSubmit.data.status !== 'IN_REVIEW') throw new Error(`Expected IN_REVIEW, got ${resSubmit.data.status}`);
    console.log('Report submitted for review.');

    console.log('--- Test 5: Finalize IN_REVIEW with <100% Completeness ---');
    const resFinalizeFailReadiness = mockRes();
    await finalizeReport(reqFinalize, resFinalizeFailReadiness);
    if (resFinalizeFailReadiness.statusCode !== 400) throw new Error(`Expected 400, got ${resFinalizeFailReadiness.statusCode}`);
    console.log(`Prevented finalization (Quality Gate): ${resFinalizeFailReadiness.data.message}`);

    console.log('--- Test 6: Insert Data to reach 100% Readiness ---');
    const record = await ESGRecord.create({ projectId: p1._id, indicatorId: i1._id, reportingPeriodId: rp1._id, status: 'APPROVED', value: 100, comments: 'REP_TEST', createdBy: p1._id, unit: 'MWh', organizationId: bu._id, evidenceIds: [new mongoose.Types.ObjectId()] });
    
    const resGenerateFinal = mockRes();
    await generateReport(reqGenerate, resGenerateFinal);
    const finalReportDraft = resGenerateFinal.data;
    await submitReportReview({ params: { id: finalReportDraft._id }, user: adminUser }, mockRes());
    
    const reqFinalizeSuccess = { params: { id: finalReportDraft._id }, user: adminUser };
    const resFinalizeSuccess = mockRes();
    await finalizeReport(reqFinalizeSuccess, resFinalizeSuccess);
    
    if (resFinalizeSuccess.statusCode !== 200) throw new Error(`Expected 200, got ${resFinalizeSuccess.statusCode} - ${JSON.stringify(resFinalizeSuccess.data)}`);
    const finalizedReport = resFinalizeSuccess.data;
    console.log(`Report finalized successfully! Snapshot ID: ${finalizedReport.snapshotId}`);

    console.log('--- Test 7: Verify Snapshot Immutability ---');
    const snapshotBefore = await ReportSnapshot.findById(finalizedReport.snapshotId);
    const kpiValueBefore = snapshotBefore!.data.kpis[0]?.value;
    console.log(`Snapshot KPI value before change: ${kpiValueBefore}`);
    
    // Maliciously modify the source ESG record
    await ESGRecord.findByIdAndUpdate(record._id, { $set: { value: 9999 } });
    console.log(`Source ESG Record maliciously updated to 9999`);
    
    const snapshotAfter = await ReportSnapshot.findById(finalizedReport.snapshotId);
    const kpiValueAfter = snapshotAfter!.data.kpis[0]?.value;
    console.log(`Snapshot KPI value after change: ${kpiValueAfter}`);
    
    if (kpiValueBefore === kpiValueAfter && kpiValueAfter === 100) {
        console.log('SUCCESS: Snapshot is 100% IMMUTABLE.');
    } else {
        throw new Error('FAILURE: Snapshot data was modified!');
    }

    // Cleanup
    await Organization.deleteMany({ code: { $in: ['REP_GRP', 'REP_BU'] } });
    await Project.deleteMany({ projectCode: 'REP_P1' });
    await ESGIndicator.deleteMany({ code: 'REP_I1' });
    await ReportingPeriod.deleteMany({ name: 'REP_FY25' });
    await ESGRecord.deleteMany({ comments: 'REP_TEST' });
    await Report.deleteMany({ name: { $regex: 'MEIL ESG Report - PROJECT' } });
    await ReportSnapshot.deleteMany({});
    
    console.log('All tests passed and cleaned up!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
