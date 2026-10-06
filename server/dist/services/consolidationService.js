"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLineage = exports.getConsolidatedKPIs = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const ESGIndicator_1 = __importDefault(require("../models/ESGIndicator"));
const hierarchy_1 = require("../utils/hierarchy");
const getConsolidatedKPIs = async (filters) => {
    const { reportingPeriodId, scopeLevel, scopeId } = filters;
    // 1. Determine the relevant Project IDs based on the scope
    let projectIds = [];
    if (scopeLevel === 'PROJECT' && scopeId) {
        projectIds = [new mongoose_1.default.Types.ObjectId(scopeId)];
    }
    else if (scopeId) {
        projectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(scopeId);
    }
    if (projectIds.length === 0) {
        return [];
    }
    // 2. Fetch Indicator configurations to know HOW to aggregate
    const indicators = await ESGIndicator_1.default.find({ status: 'ACTIVE' });
    const indicatorMap = new Map(indicators.map(i => [i._id.toString(), i]));
    // 3. Build Aggregation Pipeline for ESGRecords
    // ONLY APPROVED RECORDS
    const pipeline = [
        {
            $match: {
                reportingPeriodId: new mongoose_1.default.Types.ObjectId(reportingPeriodId),
                projectId: { $in: projectIds },
                status: 'APPROVED'
            }
        },
        {
            // We group by indicator to calculate the total/average
            $group: {
                _id: '$indicatorId',
                totalSum: { $sum: { $toDouble: '$value' } },
                avgValue: { $avg: { $toDouble: '$value' } },
                count: { $sum: 1 },
                recordIds: { $push: '$_id' } // For data lineage tracing
            }
        }
    ];
    const results = await ESGRecord_1.default.aggregate(pipeline);
    // 4. Map results to indicator configuration and apply correct math
    const consolidated = results.map(result => {
        const ind = indicatorMap.get(result._id.toString());
        if (!ind)
            return null;
        let finalValue = 0;
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
exports.getConsolidatedKPIs = getConsolidatedKPIs;
const getLineage = async (indicatorId, filters) => {
    const { reportingPeriodId, scopeLevel, scopeId } = filters;
    let projectIds = [];
    if (scopeId) {
        projectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(scopeId);
    }
    if (projectIds.length === 0) {
        return [];
    }
    // Fetch the raw approved records that contributed to this KPI
    const records = await ESGRecord_1.default.find({
        indicatorId: new mongoose_1.default.Types.ObjectId(indicatorId),
        reportingPeriodId: new mongoose_1.default.Types.ObjectId(reportingPeriodId),
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
exports.getLineage = getLineage;
