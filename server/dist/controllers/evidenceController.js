"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGaps = exports.getCoverage = exports.getEvidence = exports.deleteEvidence = exports.uploadEvidence = void 0;
const Evidence_1 = __importDefault(require("../models/Evidence"));
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const auditLogger_1 = require("../utils/auditLogger");
const hierarchy_1 = require("../utils/hierarchy");
// Note: File upload middleware (multer) should be applied in the route before this controller.
// req.file will be populated.
// @desc    Upload evidence file
// @route   POST /api/evidence
// @access  Private (Officer)
const uploadEvidence = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { projectId, reportingPeriodId, indicatorId } = req.body;
        if (!projectId || !reportingPeriodId) {
            // In a real app we'd also clean up the uploaded file if validation fails here
            if (req.file.path)
                fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Missing required context (Project, Reporting Period)' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        const newEvidence = new Evidence_1.default({
            name: req.file.originalname,
            fileUrl,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            projectId,
            reportingPeriodId,
            indicatorId,
            uploadedBy: req.user._id
        });
        const savedEvidence = await newEvidence.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'UPLOAD_EVIDENCE',
            entityType: 'Evidence',
            entityId: savedEvidence._id,
            after: savedEvidence.toObject(),
            ipAddress: req.ip
        });
        res.status(201).json(savedEvidence);
    }
    catch (error) {
        console.error(error);
        if (req.file && req.file.path)
            fs_1.default.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Server error uploading evidence' });
    }
};
exports.uploadEvidence = uploadEvidence;
// @desc    Delete evidence file
// @route   DELETE /api/evidence/:id
// @access  Private (Officer)
const deleteEvidence = async (req, res) => {
    try {
        const evidence = await Evidence_1.default.findById(req.params.id);
        if (!evidence) {
            return res.status(404).json({ message: 'Evidence not found' });
        }
        // Check if it's attached to a non-draft record
        const linkedRecords = await ESGRecord_1.default.find({ evidenceIds: evidence._id });
        const isLocked = linkedRecords.some(r => !['DRAFT', 'CORRECTION_REQUIRED', 'VALIDATION_FAILED'].includes(r.status));
        if (isLocked) {
            return res.status(400).json({ message: 'Cannot delete evidence linked to a submitted or approved record' });
        }
        const filePath = path_1.default.join(__dirname, '../../', evidence.fileUrl);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Remove from linked records
        if (linkedRecords.length > 0) {
            for (const record of linkedRecords) {
                record.evidenceIds = record.evidenceIds.filter((id) => id.toString() !== evidence._id.toString());
                await record.save();
            }
        }
        await evidence.deleteOne();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'DELETE_EVIDENCE',
            entityType: 'Evidence',
            entityId: evidence._id,
            before: evidence.toObject(),
            ipAddress: req.ip
        });
        res.json({ message: 'Evidence removed successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting evidence' });
    }
};
exports.deleteEvidence = deleteEvidence;
// @desc    Get evidence metadata by project and period
// @route   GET /api/evidence
// @access  Private
const getEvidence = async (req, res) => {
    try {
        const { projectId, reportingPeriodId } = req.query;
        let query = {};
        if (projectId)
            query.projectId = projectId;
        if (reportingPeriodId)
            query.reportingPeriodId = reportingPeriodId;
        if (req.user.role !== 'ADMIN') {
            const authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(req.user.organizationId);
            if (query.projectId) {
                if (!authorizedProjectIds.some(id => id.toString() === query.projectId.toString())) {
                    return res.status(403).json({ message: 'Not authorized for this project' });
                }
            }
            else {
                query.projectId = { $in: authorizedProjectIds };
            }
        }
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const total = await Evidence_1.default.countDocuments(query);
        const evidence = await Evidence_1.default.find(query)
            .populate('uploadedBy', 'name email')
            .sort({ uploadedAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json({
            data: evidence,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching evidence' });
    }
};
exports.getEvidence = getEvidence;
// @desc    Get evidence coverage statistics
// @route   GET /api/evidence/coverage
// @access  Private
const getCoverage = async (req, res) => {
    try {
        const { reportingPeriodId } = req.query;
        if (!reportingPeriodId)
            return res.status(400).json({ message: 'reportingPeriodId is required' });
        let recordQuery = { reportingPeriodId };
        if (req.user.role !== 'ADMIN') {
            const authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(req.user.organizationId);
            recordQuery.projectId = { $in: authorizedProjectIds };
        }
        const totalRecords = await ESGRecord_1.default.countDocuments(recordQuery);
        const recordsWithEvidence = await ESGRecord_1.default.countDocuments({
            ...recordQuery,
            'evidenceIds.0': { $exists: true }
        });
        const coverage = totalRecords === 0 ? 'N/A' : ((recordsWithEvidence / totalRecords) * 100).toFixed(2);
        res.json({
            totalRecords,
            recordsWithEvidence,
            coveragePercent: coverage
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error calculating evidence coverage' });
    }
};
exports.getCoverage = getCoverage;
// @desc    Get evidence gap report
// @route   GET /api/evidence/gaps
// @access  Private
const getGaps = async (req, res) => {
    try {
        const { reportingPeriodId } = req.query;
        if (!reportingPeriodId)
            return res.status(400).json({ message: 'reportingPeriodId is required' });
        let query = {
            reportingPeriodId,
            'evidenceIds': { $size: 0 }
        };
        if (req.user.role !== 'ADMIN') {
            const authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(req.user.organizationId);
            query.projectId = { $in: authorizedProjectIds };
        }
        // Records missing evidence
        const gaps = await ESGRecord_1.default.find(query)
            .populate('projectId', 'name projectCode')
            .populate('indicatorId', 'name code')
            .populate('organizationId', 'name')
            .sort({ createdAt: -1 });
        res.json(gaps);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error generating evidence gap report' });
    }
};
exports.getGaps = getGaps;
