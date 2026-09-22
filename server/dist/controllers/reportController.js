"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReport = exports.getEvidencePack = exports.getReportLineage = exports.compareReports = exports.getReportVersions = exports.archiveReport = exports.finalizeReport = exports.submitReportReview = exports.qualityCheckReport = exports.getReportById = exports.getReports = exports.generateReport = void 0;
const Report_1 = __importDefault(require("../models/Report"));
const ReportSnapshot_1 = __importDefault(require("../models/ReportSnapshot"));
const ReportQualityCheck_1 = __importDefault(require("../models/ReportQualityCheck"));
const Job_1 = __importDefault(require("../models/Job"));
const consolidationService_1 = require("../services/consolidationService");
const readinessService_1 = require("../services/readinessService");
const auditLogger_1 = require("../utils/auditLogger");
const hierarchy_1 = require("../utils/hierarchy");
const Project_1 = __importDefault(require("../models/Project"));
const generateReport = async (req, res) => {
    try {
        const { reportingPeriodId, scopeLevel, scopeId, reportType } = req.body;
        if (!reportingPeriodId || !scopeLevel) {
            return res.status(400).json({ message: 'Missing required configuration' });
        }
        const { role, organizationId } = req.user;
        let allowedScopeId = scopeId;
        if (role === 'PROJECT_OFFICER') {
            return res.status(403).json({ message: 'Unauthorized to generate reports' });
        }
        if (role === 'BUSINESS_UNIT_REVIEWER') {
            if (scopeLevel !== 'PROJECT' && scopeLevel !== 'BUSINESS_UNIT') {
                return res.status(403).json({ message: 'Unauthorized scope for BU Reviewer' });
            }
            if (scopeId && scopeId !== organizationId.toString()) {
                if (scopeLevel === 'PROJECT') {
                    const project = await Project_1.default.findById(scopeId);
                    if (!project || project.organizationId?.toString() !== organizationId.toString()) {
                        return res.status(403).json({ message: 'Unauthorized access to this project' });
                    }
                }
                else {
                    return res.status(403).json({ message: 'Unauthorized access to this BU' });
                }
            }
            allowedScopeId = scopeId || organizationId;
        }
        else if (role === 'SUBSIDIARY_MANAGER' || role === 'GROUP_ESG_TEAM') {
            if (role === 'SUBSIDIARY_MANAGER' && scopeLevel === 'GROUP') {
                return res.status(403).json({ message: 'Unauthorized scope for Sub Manager' });
            }
            if (scopeId && scopeId !== organizationId.toString()) {
                const isAuth = await (0, hierarchy_1.isAuthorizedScope)(organizationId, scopeId);
                if (!isAuth) {
                    if (scopeLevel === 'PROJECT') {
                        const project = await Project_1.default.findById(scopeId);
                        if (!project || !(await (0, hierarchy_1.isAuthorizedScope)(organizationId, project.organizationId))) {
                            return res.status(403).json({ message: 'Unauthorized access to this project' });
                        }
                    }
                    else {
                        return res.status(403).json({ message: 'Unauthorized access to this scope' });
                    }
                }
            }
            allowedScopeId = scopeId || organizationId;
        }
        const kpis = await (0, consolidationService_1.getConsolidatedKPIs)({ reportingPeriodId, scopeLevel, scopeId: allowedScopeId });
        const existingReports = await Report_1.default.find({
            reportingPeriodId,
            'scope.level': scopeLevel,
            'scope.organizationId': scopeId || null
        });
        const nextVersion = existingReports.length > 0
            ? Math.max(...existingReports.map(r => r.version)) + 1
            : 1;
        const reportData = {
            name: `MEIL ESG Report - ${scopeLevel} (v${nextVersion})`,
            reportType: reportType || 'BRSR_COMPREHENSIVE',
            reportingPeriodId,
            scope: {
                level: scopeLevel,
                organizationId: scopeId || null
            },
            generatedBy: req.user._id,
            status: 'DRAFT',
            version: nextVersion,
            metadata: { kpis }
        };
        const newReport = await Report_1.default.create(reportData);
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'REPORT_GENERATED',
            entityType: 'Report',
            entityId: newReport._id.toString(),
            after: { version: nextVersion, scopeLevel, status: 'DRAFT' }
        });
        res.status(201).json(newReport);
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A report with this version already exists. Please try again to generate the next version.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error generating report' });
    }
};
exports.generateReport = generateReport;
const getReports = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'SUBSIDIARY_MANAGER' || req.user.role === 'BUSINESS_UNIT_REVIEWER' || req.user.role === 'GROUP_ESG_TEAM') {
            const descendantOrgIds = await (0, hierarchy_1.getDescendantOrgIds)(req.user.organizationId);
            query['scope.organizationId'] = { $in: descendantOrgIds };
        }
        const reports = await Report_1.default.find(query)
            .populate('generatedBy', 'name email')
            .populate('reportingPeriodId', 'name')
            .sort({ createdAt: -1 });
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching reports' });
    }
};
exports.getReports = getReports;
const getReportById = async (req, res) => {
    try {
        const report = await Report_1.default.findById(req.params.id)
            .populate('generatedBy', 'name email')
            .populate('reportingPeriodId', 'name');
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        res.json(report);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching report' });
    }
};
exports.getReportById = getReportById;
const qualityCheckReport = async (req, res) => {
    try {
        const report = await Report_1.default.findById(req.params.id);
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        // Mock Quality Gate logic for now
        const checkResult = await ReportQualityCheck_1.default.findOneAndUpdate({ reportId: report._id }, {
            reportId: report._id,
            status: 'READY',
            checks: {
                dataCompleteness: { status: 'PASS', message: 'All required data points are present.' },
                validation: { status: 'PASS', message: 'No critical validation errors.' },
                evidenceCoverage: { status: 'WARNING', message: '3 evidence documents missing.' },
                brsrMapping: { status: 'PASS', message: 'BRSR mapping complete.' },
                assuranceControls: { status: 'PASS', message: 'Assurance complete.' },
                governance: { status: 'PASS', message: 'Approvals are complete.' }
            },
            anomalies: [
                { type: 'WARNING', message: 'Energy consumption dropped by 20% YoY.' }
            ]
        }, { upsert: true, new: true });
        res.json(checkResult);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error running quality check' });
    }
};
exports.qualityCheckReport = qualityCheckReport;
const submitReportReview = async (req, res) => {
    try {
        const report = await Report_1.default.findById(req.params.id);
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        if (report.status !== 'DRAFT') {
            return res.status(400).json({ message: 'Only DRAFT reports can be submitted for review' });
        }
        report.status = 'IN_REVIEW';
        await report.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'REPORT_SUBMITTED_REVIEW',
            entityType: 'Report',
            entityId: report._id.toString(),
            after: { status: 'IN_REVIEW' }
        });
        res.json(report);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error submitting review' });
    }
};
exports.submitReportReview = submitReportReview;
const finalizeReport = async (req, res) => {
    try {
        const report = await Report_1.default.findById(req.params.id);
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        if (report.status !== 'IN_REVIEW' && report.status !== 'READY_FOR_FINALIZATION') {
            return res.status(400).json({ message: 'Report must be in IN_REVIEW or READY_FOR_FINALIZATION state to finalize' });
        }
        if (report.scope.level === 'GROUP' && req.user.role !== 'GROUP_ESG_TEAM' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Unauthorized to finalize Group reports' });
        }
        let projectIds = null;
        if (report.scope.level === 'PROJECT') {
            projectIds = [report.scope.organizationId];
        }
        else if (report.scope.organizationId) {
            projectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(report.scope.organizationId.toString());
        }
        const readiness = await (0, readinessService_1.calculateReadiness)(report.reportingPeriodId.toString(), projectIds);
        if (readiness.dataCompleteness < 100) {
            return res.status(400).json({
                message: 'Quality Gate Failed: 100% Data Completeness is required to finalize report.',
                readiness
            });
        }
        // Generate snapshot
        const snapshot = await ReportSnapshot_1.default.create({
            reportId: report._id,
            reportingPeriodId: report.reportingPeriodId,
            data: {
                kpis: report.metadata?.kpis || [],
                disclosures: [],
                evidenceRefs: [],
                hierarchy: {},
                config: {}
            },
            integrityHash: 'mock-hash-value-12345'
        });
        report.status = 'FINALIZED';
        report.snapshotId = snapshot._id;
        await report.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'REPORT_FINALIZED',
            entityType: 'Report',
            entityId: report._id.toString(),
            after: { status: 'FINALIZED', snapshotId: snapshot._id }
        });
        res.json(report);
    }
    catch (error) {
        console.error("Error finalizing report:", error);
        res.status(500).json({ message: 'Server error finalizing report' });
    }
};
exports.finalizeReport = finalizeReport;
const archiveReport = async (req, res) => {
    try {
        const report = await Report_1.default.findById(req.params.id);
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        if (report.status !== 'FINALIZED') {
            return res.status(400).json({ message: 'Only FINALIZED reports can be archived' });
        }
        report.status = 'ARCHIVED';
        await report.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'REPORT_ARCHIVED',
            entityType: 'Report',
            entityId: report._id.toString(),
            after: { status: 'ARCHIVED' }
        });
        res.json(report);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error archiving report' });
    }
};
exports.archiveReport = archiveReport;
const getReportVersions = async (req, res) => {
    try {
        const report = await Report_1.default.findById(req.params.id);
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        const versions = await Report_1.default.find({
            reportingPeriodId: report.reportingPeriodId,
            'scope.level': report.scope.level,
            'scope.organizationId': report.scope.organizationId,
            reportType: report.reportType
        }).sort({ version: -1 });
        res.json(versions);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching versions' });
    }
};
exports.getReportVersions = getReportVersions;
const compareReports = async (req, res) => {
    try {
        res.json({ message: 'Comparison endpoint placeholder' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error comparing reports' });
    }
};
exports.compareReports = compareReports;
const getReportLineage = async (req, res) => {
    try {
        res.json({ message: 'Lineage trace placeholder' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching lineage' });
    }
};
exports.getReportLineage = getReportLineage;
const getEvidencePack = async (req, res) => {
    try {
        res.json({ message: 'Evidence pack generation placeholder' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching evidence pack' });
    }
};
exports.getEvidencePack = getEvidencePack;
const exportReport = async (req, res) => {
    try {
        const format = req.query.format || 'PDF';
        // Check for existing active job (Idempotency)
        const existingJob = await Job_1.default.findOne({
            type: 'REPORT_EXPORT',
            'metadata.reportId': req.params.id,
            'metadata.format': format,
            status: { $in: ['QUEUED', 'RUNNING'] }
        });
        if (existingJob) {
            return res.status(202).json({ message: 'Export job already in progress', jobId: existingJob._id });
        }
        const exportJob = await Job_1.default.create({
            type: 'REPORT_EXPORT',
            status: 'QUEUED',
            createdBy: req.user._id,
            metadata: {
                reportId: req.params.id,
                format: format
            }
        });
        // Simulate async processing
        setTimeout(async () => {
            try {
                await Job_1.default.updateOne({ _id: exportJob._id }, { status: 'RUNNING', startedAt: new Date() });
                // Simulate heavy work
                await new Promise(resolve => setTimeout(resolve, 2000));
                await Job_1.default.updateOne({ _id: exportJob._id }, {
                    status: 'COMPLETED',
                    result: { fileUrl: `/exports/report-${req.params.id}.${format.toLowerCase()}` },
                    completedAt: new Date()
                });
            }
            catch (e) {
                await Job_1.default.updateOne({ _id: exportJob._id }, {
                    status: 'FAILED',
                    error: 'Rendering service unavailable',
                    completedAt: new Date()
                });
            }
        }, 100);
        res.status(202).json({ message: 'Export job started', jobId: exportJob._id });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error exporting report' });
    }
};
exports.exportReport = exportReport;
