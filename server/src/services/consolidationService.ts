import mongoose from 'mongoose';
import ESGRecord from '../models/ESGRecord';
import ESGIndicator from '../models/ESGIndicator';
import Project from '../models/Project';
import { getAuthorizedProjectIds } from '../utils/hierarchy';

export interface ConsolidationFilters {
  reportingPeriodId: string;
  scopeLevel: 'GROUP' | 'SUBSIDIARY' | 'BUSINESS_UNIT' | 'PROJECT';
  scopeId?: string; // Optional if GROUP
}

export const getConsolidatedKPIs = async (filters: ConsolidationFilters) => {
  const { reportingPeriodId, scopeLevel, scopeId } = filters;

  // 1. Determine the relevant Project IDs based on the scope
  let projectIds: mongoose.Types.ObjectId[] = [];
  
  if (scopeLevel === 'PROJECT' && scopeId) {
    projectIds = [new mongoose.Types.ObjectId(scopeId)];
  } else if (scopeId) {
    projectIds = await getAuthorizedProjectIds(scopeId);
  }

  if (projectIds.length === 0) {
    return [];
  }

  // 2. Fetch Indicator configurations to know HOW to aggregate
  const indicators = await ESGIndicator.find({ status: 'ACTIVE' });
  const indicatorMap = new Map(indicators.map(i => [i._id.toString(), i]));

  // 3. Build Aggregation Pipeline for ESGRecords
  // ONLY APPROVED RECORDS
  const pipeline = [
    {
      $match: {
        reportingPeriodId: new mongoose.Types.ObjectId(reportingPeriodId),
        projectId: { $in: projectIds },
        status: 'APPROVED'
      }
    },
    {
      // We group by indicator to calculate the total/average
      $group: {
        _id: '$indicatorId',
        totalSum: { $sum: { $convert: { input: '$value', to: 'double', onError: 0, onNull: 0 } } },
        avgValue: { $avg: { $convert: { input: '$value', to: 'double', onError: null, onNull: null } } },
        count: { $sum: 1 },
        recordIds: { $push: '$_id' } // For data lineage tracing
      }
    }
  ];

  const results = await ESGRecord.aggregate(pipeline);

  // 4. Map results to indicator configuration and apply correct math
  const consolidated = results.map(result => {
    const ind = indicatorMap.get(result._id.toString());
    if (!ind) return null;

    let finalValue: number | string = 0;
    
    // Apply correct aggregation method based on configuration
    switch (ind.aggregationMethod) {
      case 'SUM':
        finalValue = result.totalSum;
        break;
      case 'AVERAGE':
        finalValue = result.avgValue;
        break;
      case 'COUNT':
        finalValue = result.count;
        break;
      case 'PERCENTAGE':
        // A real implementation might require grouping numerator/denominator indicators
        // For MVP, just average the percentages
        finalValue = result.avgValue;
        break;
      case 'RATIO':
      case 'INTENSITY':
        // Complex logical ratios can be added here
        finalValue = result.totalSum; 
        break;
      default:
        finalValue = result.totalSum;
    }

    return {
      indicator: {
        _id: ind._id,
        code: ind.code,
        name: ind.name,
        unit: ind.unit,
        category: ind.category,
        aggregationMethod: ind.aggregationMethod,
        isGHG: ind.isGHG,
        isWater: ind.isWater,
        isWaste: ind.isWaste,
        brsrMappings: ind.brsrMappings
      },
      value: Number(Number(finalValue).toFixed(2)),
      contributorsCount: result.count,
      // We don't send all recordIds to the frontend by default to save bandwidth, 
      // they can be fetched via a dedicated lineage API
    };
  }).filter(Boolean);

  return consolidated;
};

export const getLineage = async (indicatorId: string, filters: ConsolidationFilters) => {
  const { reportingPeriodId, scopeLevel, scopeId } = filters;

  let projectIds: mongoose.Types.ObjectId[] = [];
  
  if (scopeId) {
    projectIds = await getAuthorizedProjectIds(scopeId);
  }

  if (projectIds.length === 0) {
    return [];
  }

  // Fetch the raw approved records that contributed to this KPI
  const records = await ESGRecord.find({
    indicatorId: new mongoose.Types.ObjectId(indicatorId),
    reportingPeriodId: new mongoose.Types.ObjectId(reportingPeriodId),
    projectId: { $in: projectIds },
    status: 'APPROVED'
  })
  .populate({
    path: 'projectId',
    select: 'name projectCode organizationId businessUnitId subsidiaryId',
    populate: [
      { path: 'organizationId', select: 'name type' },
      { path: 'businessUnitId', select: 'name type' },
      { path: 'subsidiaryId', select: 'name type' }
    ]
  })
  .populate('evidenceIds', 'name fileUrl fileType fileSize')
  .populate('submittedBy', 'name email')
  .populate('approvedBy', 'name email')
  .sort({ updatedAt: -1 });

  return records;
};
