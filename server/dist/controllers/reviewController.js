"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectSubmission = exports.requestCorrection = exports.approveSubmission = exports.getPendingReviews = void 0;
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const Project_1 = __importDefault(require("../models/Project"));
const ReportingPeriod_1 = __importDefault(require("../models/ReportingPeriod"));
const auditLogger_1 = require("../utils/auditLogger");
const esgRecordController_1 = require("./esgRecordController");
const errorHandler_1 = require("../middleware/errorHandler");
// @desc    Get pending reviews
// @route   GET /api/reviews
// @access  Private (Reviewers/Managers)
const getPendingReviews = async (req, res) => {
    try {
        const { role, organizationId } = req.user;
        let query = {};
        // Reviewers see SUBMITTED or UNDER_REVIEW records for their scope
        query.status = { $in: ['SUBMITTED', 'UNDER_REVIEW'] };
        if (role === 'BUSINESS_UNIT_REVIEWER') {
            const buProjects = await Project_1.default.find({ businessUnitId: organizationId }).select('_id');
            query.projectId = { $in: buProjects.map(p => p._id) };
        }
        else if (role === 'SUBSIDIARY_MANAGER') {
            const subProjects = await Project_1.default.find({ subsidiaryId: organizationId }).select('_id');
            query.projectId = { $in: subProjects.map(p => p._id) };
        }
        const reviews = await ESGRecord_1.default.find(query)
            .populate('indicatorId')
            .populate('projectId', 'name projectCode')
            .populate('reportingPeriodId', 'name financialYear')
            .populate('submittedBy', 'name email')
            .sort({ updatedAt: -1 });
        res.json(reviews);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching pending reviews' });
    }
};
exports.getPendingReviews = getPendingReviews;
// @desc    Approve Submission
// @route   POST /api/reviews/:id/approve
// @access  Private (Reviewer)
const approveSubmission = async (req, res) => {
    try {
        const record = await ESGRecord_1.default.findById(req.params.id);
        if (!record)
            throw new errorHandler_1.AppError('Record not found', 404, 'NOT_FOUND');
        if (!(await (0, esgRecordController_1.isAuthorizedForProject)(req.user, record.projectId?._id || record.projectId))) {
            throw new errorHandler_1.AppError('Not authorized to approve this record', 403, 'FORBIDDEN');
        }
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(record.status)) {
            throw new errorHandler_1.AppError('Record is not in a reviewable state', 400, 'INVALID_STATE');
        }
        const period = await ReportingPeriod_1.default.findById(record.reportingPeriodId);
        if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
            throw new errorHandler_1.AppError('Reporting period is closed or archived', 400, 'INVALID_PERIOD_STATE');
        }
        record.status = 'APPROVED';
        record.approvedBy = req.user._id;
        record.updatedBy = req.user._id;
        await record.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'APPROVE_RECORD',
            entityType: 'ESGRecord',
            entityId: record._id,
            ipAddress: req.ip
        });
        res.json(record);
    }
    catch (error) {
        console.error('Approve Error:', error);
        if (error instanceof errorHandler_1.AppError || error.statusCode) {
            res.status(error.statusCode || 400).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Server error approving submission' });
        }
    }
};
exports.approveSubmission = approveSubmission;
// @desc    Request Correction
// @route   POST /api/reviews/:id/correction
// @access  Private (Reviewer)
const requestCorrection = async (req, res) => {
    try {
        const reason = String(req.body.reason || '').trim();
        if (!reason)
            throw new errorHandler_1.AppError('Correction reason is required', 400, 'BAD_REQUEST');
        const record = await ESGRecord_1.default.findById(req.params.id);
        if (!record)
            throw new errorHandler_1.AppError('Record not found', 404, 'NOT_FOUND');
        if (!(await (0, esgRecordController_1.isAuthorizedForProject)(req.user, record.projectId?._id || record.projectId))) {
            throw new errorHandler_1.AppError('Not authorized to request correction for this record', 403, 'FORBIDDEN');
        }
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(record.status)) {
            throw new errorHandler_1.AppError('Record is not in a reviewable state', 400, 'INVALID_STATE');
        }
        const period = await ReportingPeriod_1.default.findById(record.reportingPeriodId);
        if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
            throw new errorHandler_1.AppError('Reporting period is closed or archived', 400, 'INVALID_PERIOD_STATE');
        }
        record.status = 'CORRECTION_REQUIRED';
        record.correctionReason = reason;
        record.updatedBy = req.user._id;
        await record.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'REQUEST_CORRECTION',
            entityType: 'ESGRecord',
            entityId: record._id,
            after: { reason },
            ipAddress: req.ip
        });
        res.json(record);
    }
    catch (error) {
        console.error('Correction Error:', error);
        if (error instanceof errorHandler_1.AppError || error.statusCode) {
            res.status(error.statusCode || 400).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Server error requesting correction' });
        }
    }
};
exports.requestCorrection = requestCorrection;
// @desc    Reject Submission
// @route   POST /api/reviews/:id/reject
// @access  Private (Reviewer)
const rejectSubmission = async (req, res) => {
    try {
        const reason = String(req.body.reason || '').trim();
        if (!reason)
            throw new errorHandler_1.AppError('Rejection reason is required', 400, 'BAD_REQUEST');
        const record = await ESGRecord_1.default.findById(req.params.id);
        if (!record)
            throw new errorHandler_1.AppError('Record not found', 404, 'NOT_FOUND');
        if (!(await (0, esgRecordController_1.isAuthorizedForProject)(req.user, record.projectId?._id || record.projectId))) {
            throw new errorHandler_1.AppError('Not authorized to reject this record', 403, 'FORBIDDEN');
        }
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(record.status)) {
            throw new errorHandler_1.AppError('Record is not in a reviewable state', 400, 'INVALID_STATE');
        }
        const period = await ReportingPeriod_1.default.findById(record.reportingPeriodId);
        if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
            throw new errorHandler_1.AppError('Reporting period is closed or archived', 400, 'INVALID_PERIOD_STATE');
        }
        record.status = 'REJECTED';
        record.correctionReason = reason;
        record.updatedBy = req.user._id;
        await record.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'REJECT_RECORD',
            entityType: 'ESGRecord',
            entityId: record._id,
            after: { reason },
            ipAddress: req.ip
        });
        res.json(record);
    }
    catch (error) {
        console.error('Rejection Error:', error);
        if (error instanceof errorHandler_1.AppError || error.statusCode) {
            res.status(error.statusCode || 400).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Server error rejecting submission' });
        }
    }
};
exports.rejectSubmission = rejectSubmission;
