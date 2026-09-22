"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBRSRCoreDashboard = void 0;
const BRSRCoreConfig_1 = __importDefault(require("../models/BRSRCoreConfig"));
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const mongoose_1 = __importDefault(require("mongoose"));
const hierarchy_1 = require("../utils/hierarchy");
// @desc    Get BRSR Core Readiness & Config
// @route   GET /api/brsr-core/dashboard
// @access  Private
const getBRSRCoreDashboard = async (req, res) => {
    try {
        const { reportingPeriodId, scopeLevel, scopeId } = req.query;
        if (!reportingPeriodId) {
            res.status(400).json({ message: 'Reporting period is required' });
            return;
        }
        let authorizedProjectIds = [];
        if (req.user?.role !== 'ADMIN') {
            const orgIdToScope = scopeId ? new mongoose_1.default.Types.ObjectId(scopeId) : req.user?.organizationId;
            if (orgIdToScope) {
                authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(orgIdToScope);
            }
        }
        const configs = await BRSRCoreConfig_1.default.find({ status: 'ACTIVE' }).populate('indicatorIds', 'code name category mandatory');
        // For each core attribute, fetch related records to determine status
        const dashboardData = await Promise.all(configs.map(async (config) => {
            const indicatorIds = config.indicatorIds.map((ind) => ind._id);
            let query = {
                reportingPeriodId: new mongoose_1.default.Types.ObjectId(reportingPeriodId),
                indicatorId: { $in: indicatorIds }
            };
            if (req.user?.role !== 'ADMIN') {
                query.projectId = { $in: authorizedProjectIds };
            }
            const records = await ESGRecord_1.default.find(query);
            // Enforce strict business logic: Only APPROVED records contribute to completeness metrics
            const approvedRecords = records.filter(r => r.status === 'APPROVED');
            const recordsWithData = approvedRecords.filter(r => r.value !== undefined && r.value !== null);
            const recordsWithEvidence = approvedRecords.filter(r => r.evidenceIds && r.evidenceIds.length > 0);
            // Simple heuristic for demo: If we have approved records for ALL mapped indicators, it's 'Ready'.
            // Otherwise, if we have some data but missing evidence/approvals, 'Attention'.
            // If no data, 'Missing Data'.
            let status = 'Missing Data';
            if (approvedRecords.length > 0 && approvedRecords.length >= indicatorIds.length) {
                status = 'Ready';
            }
            else if (recordsWithData.length > 0) {
                status = 'Attention Required';
            }
            return {
                _id: config._id,
                attributeName: config.attributeName,
                description: config.description,
                mappedIndicatorsCount: indicatorIds.length,
                status,
                metrics: {
                    totalData: recordsWithData.length,
                    withEvidence: recordsWithEvidence.length,
                    approved: approvedRecords.length
                }
            };
        }));
        // Calculate overall core readiness
        const totalReady = dashboardData.filter(d => d.status === 'Ready').length;
        const overallReadiness = dashboardData.length > 0 ? Math.round((totalReady / dashboardData.length) * 100) : 0;
        res.json({
            overallReadiness,
            attributes: dashboardData
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error loading BRSR Core data' });
    }
};
exports.getBRSRCoreDashboard = getBRSRCoreDashboard;
