"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnomalies = exports.getDataQuality = exports.getContributors = exports.getTrends = exports.getOverview = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const ReportingPeriod_1 = __importDefault(require("../models/ReportingPeriod"));
const readinessService_1 = require("../services/readinessService");
const hierarchy_1 = require("../utils/hierarchy");
// Helper for RBAC filtering
const getOrgFilter = async (user) => {
    if (user.role === 'PROJECT_OFFICER') {
        return { organizationId: user.organizationId };
    }
    else if (user.role === 'BUSINESS_UNIT_REVIEWER' || user.role === 'SUBSIDIARY_MANAGER' || user.role === 'GROUP_ESG_TEAM') {
        const authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(user.organizationId);
        return { projectId: { $in: authorizedProjectIds } };
    }
    return {}; // Admin/Auditor see all
};
// @desc    Get Analytics Overview
// @route   GET /api/analytics/overview
const getOverview = async (req, res) => {
    try {
        const { reportingPeriodId } = req.query;
        if (!reportingPeriodId)
            return res.status(400).json({ message: 'reportingPeriodId is required' });
        const orgFilter = await getOrgFilter(req.user);
        const baseMatch = { reportingPeriodId: new mongoose_1.default.Types.ObjectId(reportingPeriodId), ...orgFilter };
        const authorizedProjectIds = orgFilter.projectId?.$in || null;
        const readiness = await (0, readinessService_1.calculateReadiness)(reportingPeriodId, authorizedProjectIds);
        const pendingApprovals = await ESGRecord_1.default.countDocuments({ ...baseMatch, status: 'SUBMITTED' });
        const validationErrors = await ESGRecord_1.default.countDocuments({ ...baseMatch, status: 'VALIDATION_FAILED' });
        const missingEvidence = await ESGRecord_1.default.countDocuments({ ...baseMatch, evidenceIds: { $size: 0 } });
        const incompleteDisclosures = await ESGRecord_1.default.countDocuments({ ...baseMatch, status: 'DRAFT' });
        res.json({
            readiness,
            attentionRequired: {
                pendingApprovals,
                validationErrors,
                missingEvidence,
                incompleteDisclosures
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching analytics overview' });
    }
};
exports.getOverview = getOverview;
// @desc    Get Trends (Period over Period)
// @route   GET /api/analytics/trends
const getTrends = async (req, res) => {
    try {
        const { indicatorId } = req.query;
        if (!indicatorId)
            return res.status(400).json({ message: 'indicatorId is required' });
        const orgFilter = await getOrgFilter(req.user);
        const trends = await ESGRecord_1.default.aggregate([
            {
                $match: {
                    indicatorId: new mongoose_1.default.Types.ObjectId(indicatorId),
                    status: 'APPROVED',
                    ...orgFilter
                }
            },
            {
                $group: {
                    _id: '$reportingPeriodId',
                    totalValue: { $sum: '$value' } // Assuming numeric values for simplicity
                }
            },
            {
                $lookup: {
                    from: 'reportingperiods',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'period'
                }
            },
            { $unwind: '$period' },
            { $sort: { 'period.startDate': 1 } },
            {
                $project: {
                    periodId: '$_id',
                    periodName: '$period.name',
                    financialYear: '$period.financialYear',
                    value: '$totalValue'
                }
            }
        ]);
        res.json(trends);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching trends' });
    }
};
exports.getTrends = getTrends;
// @desc    Get Contributors
// @route   GET /api/analytics/contributors
const getContributors = async (req, res) => {
    try {
        const { indicatorId, reportingPeriodId } = req.query;
        if (!indicatorId || !reportingPeriodId) {
            return res.status(400).json({ message: 'indicatorId and reportingPeriodId are required' });
        }
        const orgFilter = await getOrgFilter(req.user);
        const contributors = await ESGRecord_1.default.aggregate([
            {
                $match: {
                    indicatorId: new mongoose_1.default.Types.ObjectId(indicatorId),
                    reportingPeriodId: new mongoose_1.default.Types.ObjectId(reportingPeriodId),
                    status: 'APPROVED',
                    projectId: { $exists: true },
                    ...orgFilter
                }
            },
            {
                $group: {
                    _id: '$projectId',
                    totalValue: { $sum: '$value' }
                }
            },
            {
                $lookup: {
                    from: 'projects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'project'
                }
            },
            { $unwind: '$project' },
            {
                $project: {
                    projectId: '$_id',
                    projectName: '$project.name',
                    projectCode: '$project.projectCode',
                    value: '$totalValue'
                }
            },
            { $sort: { value: -1 } }
        ]);
        const total = contributors.reduce((sum, c) => sum + c.value, 0);
        const result = contributors.map(c => ({
            ...c,
            percentage: total > 0 ? ((c.value / total) * 100).toFixed(2) : '0'
        }));
        res.json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching contributors' });
    }
};
exports.getContributors = getContributors;
// @desc    Get Data Quality
// @route   GET /api/analytics/data-quality
const getDataQuality = async (req, res) => {
    try {
        const { reportingPeriodId } = req.query;
        const baseMatch = await getOrgFilter(req.user);
        if (reportingPeriodId)
            baseMatch.reportingPeriodId = new mongoose_1.default.Types.ObjectId(reportingPeriodId);
        const quality = await ESGRecord_1.default.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        res.json(quality);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching data quality' });
    }
};
exports.getDataQuality = getDataQuality;
// @desc    Get Anomalies
// @route   GET /api/analytics/anomalies
const getAnomalies = async (req, res) => {
    try {
        const { indicatorId, reportingPeriodId } = req.query;
        if (!indicatorId || !reportingPeriodId)
            return res.status(400).json({ message: 'Missing parameters' });
        const threshold = parseFloat(req.query.threshold) || 25; // 25% default
        // Fetch periods
        const periods = await ReportingPeriod_1.default.find().sort({ startDate: -1 });
        const currentPeriod = periods.find(p => p._id.toString() === reportingPeriodId);
        if (!currentPeriod)
            return res.status(404).json({ message: 'Reporting period not found' });
        const prevPeriod = periods.find(p => p.startDate < currentPeriod.startDate);
        if (!prevPeriod) {
            return res.json({ message: 'Not enough historical data for anomaly detection.' });
        }
        const orgFilter = await getOrgFilter(req.user);
        const currentRecords = await ESGRecord_1.default.aggregate([
            { $match: { indicatorId: new mongoose_1.default.Types.ObjectId(indicatorId), reportingPeriodId: currentPeriod._id, status: 'APPROVED', ...orgFilter } },
            { $group: { _id: null, total: { $sum: '$value' } } }
        ]);
        const prevRecords = await ESGRecord_1.default.aggregate([
            { $match: { indicatorId: new mongoose_1.default.Types.ObjectId(indicatorId), reportingPeriodId: prevPeriod._id, status: 'APPROVED', ...orgFilter } },
            { $group: { _id: null, total: { $sum: '$value' } } }
        ]);
        const currentVal = currentRecords[0]?.total || 0;
        const prevVal = prevRecords[0]?.total || 0;
        const anomalies = [];
        if (prevVal > 0) {
            const diff = Math.abs(currentVal - prevVal);
            const percentChange = (diff / prevVal) * 100;
            if (percentChange > threshold) {
                anomalies.push({
                    indicatorId,
                    type: currentVal > prevVal ? 'SPIKE' : 'DROP',
                    message: `Significant change detected: ${currentVal > prevVal ? 'Increased' : 'Decreased'} by ${percentChange.toFixed(1)}% compared to previous period.`,
                    severity: 'MEDIUM'
                });
            }
        }
        res.json(anomalies);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching anomalies' });
    }
};
exports.getAnomalies = getAnomalies;
