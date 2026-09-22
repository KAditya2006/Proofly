import mongoose from 'mongoose';
import ESGRecord from '../models/ESGRecord';
import ESGIndicator from '../models/ESGIndicator';
import Project from '../models/Project';

export const calculateReadiness = async (reportingPeriodId: string, orgProjectIds?: any[] | null) => {
  // 1. Total applicable indicators (active & mandatory)
  const mandatoryIndicators = await ESGIndicator.find({ status: 'ACTIVE', mandatory: true });
  const totalMandatory = mandatoryIndicators.length;

  if (totalMandatory === 0) {
    return {
      overall: 100,
      dataCompleteness: 100,
      evidenceCoverage: 100,
      approval: 100,
      mapping: 100,
      breakdown: {
        missingData: 0,
        missingEvidence: 0,
        pendingApproval: 0,
        missingMapping: 0
      }
    };
  }

  // For real enterprise logic, we would cross-multiply Total Mandatory Indicators * Active Projects
  let activeProjectsQuery: any = { status: 'ACTIVE' };
  if (orgProjectIds && orgProjectIds.length > 0) {
    activeProjectsQuery._id = { $in: orgProjectIds };
  } else if (orgProjectIds !== undefined && orgProjectIds === null) {
    // If explicitly null but passed, it implies no projects are authorized
    // For safety, but usually null means don't filter.
  }
  
  const activeProjects = await Project.find(activeProjectsQuery);
  const expectedRecordCount = totalMandatory * activeProjects.length;

  if (expectedRecordCount === 0) {
    return { overall: 100, dataCompleteness: 100, evidenceCoverage: 100, approval: 100, mapping: 100, breakdown: {} };
  }

  // 2. Fetch all records for this period (for active projects)
  const records = await ESGRecord.find({
    reportingPeriodId: new mongoose.Types.ObjectId(reportingPeriodId),
    projectId: { $in: activeProjects.map(p => p._id) },
    indicatorId: { $in: mandatoryIndicators.map(i => i._id) }
  });

  // 3. Metrics
  // Enforce strict business logic: Only APPROVED records contribute to completeness and evidence metrics
  const approvedRecords = records.filter(r => r.status === 'APPROVED');
  const recordsWithData = approvedRecords.filter(r => r.value !== undefined && r.value !== null);
  const recordsWithEvidence = approvedRecords.filter(r => r.evidenceIds && r.evidenceIds.length > 0);
  
  // Mapping completeness (indicators that have brsrMappings defined)
  const mappedIndicators = mandatoryIndicators.filter(i => i.brsrMappings && i.brsrMappings.length > 0);

  // Prevent values > 100% in case of unexpected DB race conditions or duplicates
  const dataCompleteness = Math.min(100, Math.round((recordsWithData.length / expectedRecordCount) * 100));
  const evidenceCoverage = Math.min(100, Math.round((recordsWithEvidence.length / expectedRecordCount) * 100));
  const approval = Math.min(100, Math.round((approvedRecords.length / expectedRecordCount) * 100));
  const mapping = Math.round((mappedIndicators.length / totalMandatory) * 100);

  // 4. BRSR Core
  const coreConfigs = await mongoose.model('BRSRCoreConfig').find({ status: 'ACTIVE' });
  const brsrCore = coreConfigs.length > 0 ? 90 : 0; // Mock calculation for overall readiness UI integration

  // 5. Value Chain
  const partners = await mongoose.model('ValueChainPartner').find({
    reportingPeriodId: new mongoose.Types.ObjectId(reportingPeriodId)
  });
  const approvedPartners = partners.filter((p: any) => p.status === 'APPROVED');
  const valueChain = partners.length > 0 ? Math.round((approvedPartners.length / partners.length) * 100) : 0;

  // Overall readiness
  const overall = Math.round((dataCompleteness + evidenceCoverage + approval + mapping + brsrCore + valueChain) / 6);

  return {
    overall,
    dataCompleteness,
    evidenceCoverage,
    approval,
    mapping,
    brsrCore,
    valueChain,
    breakdown: {
      missingData: expectedRecordCount - recordsWithData.length,
      missingEvidence: expectedRecordCount - recordsWithEvidence.length,
      pendingApproval: expectedRecordCount - approvedRecords.length,
      missingMapping: totalMandatory - mappedIndicators.length,
      pendingPartners: partners.length - approvedPartners.length
    }
  };
};
