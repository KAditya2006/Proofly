"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFinding = exports.createFinding = exports.getFindings = exports.updateSampleStatus = exports.createSample = exports.getSamples = void 0;
const AssuranceSample_1 = __importDefault(require("../models/AssuranceSample"));
const AssuranceFinding_1 = __importDefault(require("../models/AssuranceFinding"));
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const hierarchy_1 = require("../utils/hierarchy");
// Fetch all assurance samples for a given reporting period
const getSamples = async (req, res) => {
    try {
        const { reportingPeriodId } = req.query;
        if (!reportingPeriodId)
            return res.status(400).json({ message: 'reportingPeriodId is required' });
        let query = { reportingPeriodId };
        // Fetch authorized project IDs and bound the samples
        if (req.user?.role !== 'ADMIN') {
            const authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(req.user.organizationId);
            const authorizedRecords = await ESGRecord_1.default.find({ projectId: { $in: authorizedProjectIds } }).select('_id');
            query.recordId = { $in: authorizedRecords.map(r => r._id) };
        }
        const samples = await AssuranceSample_1.default.find(query)
            .populate({
            path: 'recordId',
            populate: [
                { path: 'projectId indicatorId organizationId' },
                { path: 'evidenceIds' }
            ]
        })
            .populate('selectedBy', 'name role')
            .sort({ createdAt: -1 });
        res.json(samples);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getSamples = getSamples;
// Select a new sample for assurance
const createSample = async (req, res) => {
    try {
        const { recordId, reportingPeriodId, reason } = req.body;
        // Ensure the record exists
        const record = await ESGRecord_1.default.findById(recordId);
        if (!record)
            return res.status(404).json({ message: 'ESG Record not found' });
        if (record.status !== 'APPROVED') {
            return res.status(400).json({ message: 'Only APPROVED records can be sampled for assurance.' });
        }
        if (req.user?.role !== 'ADMIN') {
            const authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(req.user.organizationId);
            if (!authorizedProjectIds.some(pid => pid.toString() === record.projectId?.toString())) {
                return res.status(403).json({ message: 'Not authorized to sample this record.' });
            }
        }
        const existingSample = await AssuranceSample_1.default.findOne({ recordId });
        if (existingSample)
            return res.status(400).json({ message: 'Record is already sampled' });
        const sample = await AssuranceSample_1.default.create({
            recordId,
            reportingPeriodId,
            selectedBy: req.user?._id,
            reason,
            status: 'SELECTED'
        });
        await AuditLog_1.default.create({
            action: 'CREATE',
            entityType: 'AssuranceSample',
            entityId: sample._id,
            userId: req.user?._id
        });
        res.status(201).json(sample);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.createSample = createSample;
const updateSampleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const sample = await AssuranceSample_1.default.findById(id).populate('recordId');
        if (!sample)
            return res.status(404).json({ message: 'Sample not found' });
        if (req.user?.role !== 'ADMIN') {
            const authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(req.user.organizationId);
            const record = sample.recordId;
            if (!authorizedProjectIds.some(pid => pid.toString() === record.projectId?.toString())) {
                return res.status(403).json({ message: 'Not authorized to modify this sample.' });
            }
        }
        sample.status = status;
        await sample.save();
        res.json(sample);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.updateSampleStatus = updateSampleStatus;
// Fetch findings
const getFindings = async (req, res) => {
    try {
        const { reportingPeriodId } = req.query;
        let query = {};
        if (reportingPeriodId)
            query.reportingPeriodId = reportingPeriodId;
        if (req.user?.role !== 'ADMIN') {
            const authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(req.user.organizationId);
            const authorizedRecords = await ESGRecord_1.default.find({ projectId: { $in: authorizedProjectIds } }).select('_id');
            query.recordId = { $in: authorizedRecords.map(r => r._id) };
        }
        const findings = await AssuranceFinding_1.default.find(query)
            .populate('sampleId')
            .populate({ path: 'recordId', populate: { path: 'projectId indicatorId' } })
            .populate('createdBy', 'name role')
            .populate('resolvedBy', 'name role')
            .sort({ createdAt: -1 });
        res.json(findings);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getFindings = getFindings;
const createFinding = async (req, res) => {
    try {
        const { sampleId, findingTitle, description, severity } = req.body;
        const sample = await AssuranceSample_1.default.findById(sampleId).populate('recordId');
        if (!sample)
            return res.status(404).json({ message: 'Sample not found' });
        if (req.user?.role !== 'ADMIN') {
            const authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(req.user.organizationId);
            const record = sample.recordId;
            if (!authorizedProjectIds.some(pid => pid.toString() === record.projectId?.toString())) {
                return res.status(403).json({ message: 'Not authorized to create a finding for this sample.' });
            }
        }
        const finding = await AssuranceFinding_1.default.create({
            sampleId,
            recordId: sample.recordId,
            reportingPeriodId: sample.reportingPeriodId,
            findingTitle,
            description,
            severity,
            status: 'OPEN',
            createdBy: req.user?._id
        });
        // Auto update sample status to ISSUE_FOUND
        sample.status = 'ISSUE_FOUND';
        await sample.save();
        await AuditLog_1.default.create({
            action: 'CREATE',
            entityType: 'AssuranceFinding',
            entityId: finding._id,
            userId: req.user?._id
        });
        res.status(201).json(finding);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.createFinding = createFinding;
const resolveFinding = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolutionRemarks } = req.body;
        const finding = await AssuranceFinding_1.default.findById(id).populate('recordId');
        if (!finding)
            return res.status(404).json({ message: 'Finding not found' });
        if (req.user?.role !== 'ADMIN') {
            const authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(req.user.organizationId);
            const record = finding.recordId;
            if (!authorizedProjectIds.some(pid => pid.toString() === record.projectId?.toString())) {
                return res.status(403).json({ message: 'Not authorized to resolve this finding.' });
            }
        }
        finding.status = 'RESOLVED';
        finding.resolvedBy = req.user?._id;
        finding.resolutionRemarks = resolutionRemarks;
        await finding.save();
        await AuditLog_1.default.create({
            action: 'UPDATE',
            entityType: 'AssuranceFinding',
            entityId: finding._id,
            userId: req.user?._id
        });
        res.json(finding);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.resolveFinding = resolveFinding;
