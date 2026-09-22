"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportingPeriod = exports.createReportingPeriod = exports.closeReportingPeriod = exports.getActiveReportingPeriods = exports.getReportingPeriods = void 0;
const ReportingPeriod_1 = __importDefault(require("../models/ReportingPeriod"));
const Task_1 = __importDefault(require("../models/Task"));
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const errorHandler_1 = require("../middleware/errorHandler");
const auditLogger_1 = require("../utils/auditLogger");
// @desc    Get all reporting periods
// @route   GET /api/reporting-periods
// @access  Private
const getReportingPeriods = async (req, res) => {
    try {
        const periods = await ReportingPeriod_1.default.find().sort({ startDate: -1 });
        res.json(periods);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching reporting periods' });
    }
};
exports.getReportingPeriods = getReportingPeriods;
// @desc    Get active reporting periods
// @route   GET /api/reporting-periods/active
// @access  Private
const getActiveReportingPeriods = async (req, res) => {
    try {
        const periods = await ReportingPeriod_1.default.find({ status: { $ne: 'ARCHIVED' } }).sort({ startDate: -1 });
        res.json(periods);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching active reporting periods' });
    }
};
exports.getActiveReportingPeriods = getActiveReportingPeriods;
// @desc    Close reporting period
// @route   POST /api/reporting-periods/:id/close
// @access  Private
const closeReportingPeriod = async (req, res) => {
    try {
        const periodId = req.params.id;
        const period = await ReportingPeriod_1.default.findById(periodId);
        if (!period) {
            throw new errorHandler_1.AppError('Reporting period not found', 404, 'RESOURCE_NOT_FOUND');
        }
        // 1. Check for unresolved critical tasks
        const unresolvedTasks = await Task_1.default.countDocuments({
            reportingPeriodId: periodId,
            status: { $ne: 'COMPLETED' },
            priority: 'HIGH'
        });
        // 2. Check for pending submissions
        const pendingSubmissions = await ESGRecord_1.default.countDocuments({
            reportingPeriodId: periodId,
            status: { $in: ['DRAFT', 'SUBMITTED', 'REJECTED'] }
        });
        if (unresolvedTasks > 0 || pendingSubmissions > 0) {
            return res.status(400).json({
                success: false,
                status: 'CANNOT_CLOSE',
                reasons: [
                    ...(unresolvedTasks > 0 ? [`${unresolvedTasks} critical tasks unresolved`] : []),
                    ...(pendingSubmissions > 0 ? [`${pendingSubmissions} records pending approval`] : [])
                ]
            });
        }
        period.status = 'CLOSED';
        await period.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'REPORTING_PERIOD_CLOSED',
            entityType: 'ReportingPeriod',
            entityId: period._id.toString(),
            after: { status: 'CLOSED' }
        });
        res.json({
            success: true,
            status: 'CAN_CLOSE',
            period
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            return res.status(error.statusCode).json({ message: error.message, error: { code: error.errorCode } });
        return res.status(500).json({ message: 'Server error closing reporting period' });
    }
};
exports.closeReportingPeriod = closeReportingPeriod;
// @desc    Create a reporting period
// @route   POST /api/reporting-periods
// @access  Private/Admin
const createReportingPeriod = async (req, res) => {
    try {
        const { name, financialYear, startDate, endDate, status, isCurrent } = req.body;
        if (!name || !financialYear || !startDate || !endDate) {
            throw new errorHandler_1.AppError('Missing required fields', 400, 'BAD_REQUEST');
        }
        if (new Date(startDate) >= new Date(endDate)) {
            throw new errorHandler_1.AppError('Start date must be before end date', 400, 'INVALID_DATES');
        }
        const existing = await ReportingPeriod_1.default.findOne({ financialYear });
        if (existing) {
            throw new errorHandler_1.AppError(`Reporting period for financial year ${financialYear} already exists`, 400, 'DUPLICATE_FY');
        }
        if (isCurrent) {
            // Ensure only one period is current
            await ReportingPeriod_1.default.updateMany({}, { isCurrent: false });
        }
        const period = await ReportingPeriod_1.default.create({
            name,
            financialYear,
            startDate,
            endDate,
            status: status || 'PLANNING',
            isCurrent: isCurrent || false
        });
        const { logAudit } = require('../utils/auditLogger');
        await logAudit({
            userId: req.user._id,
            action: 'REPORTING_PERIOD_CREATED',
            entityType: 'ReportingPeriod',
            entityId: period._id.toString(),
            after: { name, financialYear, status: period.status, isCurrent: period.isCurrent }
        });
        res.status(201).json({ success: true, data: period });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            return res.status(error.statusCode).json({ message: error.message, error: { code: error.errorCode } });
        console.error(error);
        res.status(500).json({ message: 'Server error creating reporting period' });
    }
};
exports.createReportingPeriod = createReportingPeriod;
// @desc    Update a reporting period
// @route   PUT /api/reporting-periods/:id
// @access  Private/Admin
const updateReportingPeriod = async (req, res) => {
    try {
        const period = await ReportingPeriod_1.default.findById(req.params.id);
        if (!period) {
            throw new errorHandler_1.AppError('Reporting period not found', 404, 'NOT_FOUND');
        }
        const { name, financialYear, startDate, endDate, status, isCurrent } = req.body;
        const beforeState = {
            name: period.name,
            financialYear: period.financialYear,
            status: period.status,
            isCurrent: period.isCurrent
        };
        if (name)
            period.name = name;
        if (financialYear && financialYear !== period.financialYear) {
            const existing = await ReportingPeriod_1.default.findOne({ financialYear });
            if (existing) {
                throw new errorHandler_1.AppError(`Reporting period for financial year ${financialYear} already exists`, 400, 'DUPLICATE_FY');
            }
            period.financialYear = financialYear;
        }
        if (startDate)
            period.startDate = startDate;
        if (endDate)
            period.endDate = endDate;
        if (period.startDate >= period.endDate) {
            throw new errorHandler_1.AppError('Start date must be before end date', 400, 'INVALID_DATES');
        }
        if (status) {
            const VALID_STATUSES = ['PLANNING', 'OPEN', 'DATA_COLLECTION', 'REVIEW', 'ASSURANCE', 'FINALIZATION', 'CLOSED', 'ARCHIVED'];
            if (!VALID_STATUSES.includes(status)) {
                throw new errorHandler_1.AppError('Invalid status', 400, 'INVALID_STATUS');
            }
            period.status = status;
        }
        if (isCurrent !== undefined) {
            if (isCurrent && !period.isCurrent) {
                await ReportingPeriod_1.default.updateMany({ _id: { $ne: period._id } }, { isCurrent: false });
            }
            period.isCurrent = isCurrent;
        }
        await period.save();
        const { logAudit } = require('../utils/auditLogger');
        await logAudit({
            userId: req.user._id,
            action: 'REPORTING_PERIOD_UPDATED',
            entityType: 'ReportingPeriod',
            entityId: period._id.toString(),
            before: beforeState,
            after: { name: period.name, financialYear: period.financialYear, status: period.status, isCurrent: period.isCurrent }
        });
        res.json({ success: true, data: period });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            return res.status(error.statusCode).json({ message: error.message, error: { code: error.errorCode } });
        console.error(error);
        res.status(500).json({ message: 'Server error updating reporting period' });
    }
};
exports.updateReportingPeriod = updateReportingPeriod;
