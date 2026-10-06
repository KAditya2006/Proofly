"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReport = exports.getEvidencePack = exports.getReportLineage = exports.compareReports = exports.getReportVersions = exports.archiveReport = exports.finalizeReport = exports.submitReportReview = exports.qualityCheckReport = exports.getReportById = exports.getReports = exports.generateReport = void 0;
const Report_1 = __importDefault(require("../models/Report"));
const ReportSnapshot_1 = __importDefault(require("../models/ReportSnapshot"));
const ReportQualityCheck_1 = __importDefault(require("../models/ReportQualityCheck"));
const consolidationService_1 = require("../services/consolidationService");
const readinessService_1 = require("../services/readinessService");
const mongoose_1 = __importDefault(require("mongoose"));
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
        // Retrieve granular source records for traceability
        const sourceRecords = await mongoose_1.default.model('ESGRecord').find({
            reportingPeriodId: report.reportingPeriodId,
            status: 'APPROVED',
            ...(projectIds ? { projectId: { $in: projectIds } } : {})
        }).select('_id indicatorId projectId evidenceIds value');
        const evidenceRefs = sourceRecords.map((r) => ({
            recordId: r._id,
            indicatorId: r.indicatorId,
            projectId: r.projectId,
            value: r.value,
            evidenceIds: r.evidenceIds || []
        }));
        // Generate snapshot
        const snapshot = await ReportSnapshot_1.default.create({
            reportId: report._id,
            reportingPeriodId: report.reportingPeriodId,
            data: {
                kpis: report.metadata?.kpis || [],
                disclosures: [],
                evidenceRefs: evidenceRefs,
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
        const report = await Report_1.default.findById(req.params.id);
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        if (report.status !== 'FINALIZED' || !report.snapshotId) {
            return res.status(400).json({ message: 'Lineage trace is only available for FINALIZED reports with a snapshot' });
        }
        const snapshot = await ReportSnapshot_1.default.findById(report.snapshotId);
        if (!snapshot) {
            return res.status(404).json({ message: 'Report snapshot data not found' });
        }
        // Populate indicator and project details dynamically to provide readable names in UI
        const IndicatorModel = mongoose_1.default.model('ESGIndicator');
        const ProjectModel = mongoose_1.default.model('Project');
        // Convert to regular array and attach display details
        const lineageDetails = await Promise.all((snapshot.data.evidenceRefs || []).map(async (ref) => {
            const indicator = await IndicatorModel.findById(ref.indicatorId).select('code name unit isGHG isWater isWaste');
            const project = await ProjectModel.findById(ref.projectId).select('name projectCode businessUnitId subsidiaryId').populate('businessUnitId subsidiaryId', 'name type code');
            return {
                recordId: ref.recordId,
                value: ref.value,
                evidenceIds: ref.evidenceIds || [],
                indicator,
                project
            };
        }));
        res.json({
            snapshotId: snapshot._id,
            timestamp: snapshot.timestamp,
            kpis: snapshot.data.kpis || [],
            lineage: lineageDetails
        });
    }
    catch (error) {
        console.error(error);
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
const pdfkit_1 = __importDefault(require("pdfkit"));
const exceljs_1 = __importDefault(require("exceljs"));
const exportReport = async (req, res) => {
    try {
        const format = req.query.format || 'PDF';
        const report = await Report_1.default.findById(req.params.id)
            .populate('reportingPeriodId', 'name financialYear startDate endDate');
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        // RBAC Check
        if (report.scope.level === 'GROUP' && req.user.role !== 'GROUP_ESG_TEAM' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Unauthorized to export Group reports' });
        }
        if (!report.snapshotId) {
            return res.status(400).json({ message: 'Only FINALIZED reports with a valid snapshot can be exported' });
        }
        const snapshot = await ReportSnapshot_1.default.findById(report.snapshotId);
        if (!snapshot) {
            return res.status(404).json({ message: 'Report snapshot data not found' });
        }
        const kpis = snapshot.data.kpis || [];
        const period = report.reportingPeriodId;
        const periodStr = `${period?.name || 'N/A'} (${period?.financialYear || ''})`;
        const reportTitle = `MEIL ESG360 BRSR Report - ${period?.financialYear || ''}`;
        // Group KPIs based on BRSR mapping and Environmental flags
        const secA = [];
        const secB = [];
        const secC = {};
        const envData = { ghg: [], water: [], waste: [] };
        kpis.forEach((kpi) => {
            const ind = kpi.indicator;
            // Populate Sections
            let inSectionC = false;
            if (ind.brsrMappings && ind.brsrMappings.length > 0) {
                ind.brsrMappings.forEach((mapping) => {
                    const normSection = mapping.section ? mapping.section.replace(/^Section\s+/i, '').trim().toUpperCase() : '';
                    const normPrinciple = mapping.principle ? mapping.principle.replace(/^Principle\s+/i, 'P').trim().toUpperCase() : '';
                    if (normSection === 'A')
                        secA.push({ ...kpi, principle: normPrinciple });
                    else if (normSection === 'B')
                        secB.push({ ...kpi, principle: normPrinciple });
                    else if (normSection === 'C' && normPrinciple) {
                        inSectionC = true;
                        if (!secC[normPrinciple])
                            secC[normPrinciple] = [];
                        secC[normPrinciple].push({ ...kpi, principle: normPrinciple });
                    }
                });
            }
            // Populate Environmental Data (only if not already in Section C to prevent duplication)
            if (!inSectionC) {
                if (ind.isGHG)
                    envData.ghg.push(kpi);
                if (ind.isWater)
                    envData.water.push(kpi);
                if (ind.isWaste)
                    envData.waste.push(kpi);
            }
        });
        if (format === 'PDF') {
            const doc = new pdfkit_1.default({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Report_${report.version}.pdf`);
            doc.pipe(res);
            // Cover / Metadata
            doc.fontSize(20).text('MEIL ESG360', { align: 'center' });
            doc.fontSize(16).text(reportTitle, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Organization / Scope: ${report.scope.level}`);
            doc.text(`Reporting Period: ${periodStr}`);
            doc.text(`Report Generation Date: ${new Date().toLocaleDateString()}`);
            doc.text(`Snapshot/Reference ID: ${snapshot._id.toString()}`);
            doc.moveDown(2);
            const printKpi = (k) => {
                doc.fontSize(10).font('Helvetica-Bold').text(`${k.indicator.code} - ${k.indicator.name}`);
                doc.font('Helvetica').text(`Value: ${k.value} ${k.indicator.unit}`);
                doc.text(`Reporting Period: ${periodStr}`);
                if (k.principle)
                    doc.text(`Principle: ${k.principle}`);
                doc.text(`Source: MEIL ESG360 (Contributors: ${k.contributorsCount})`);
                doc.moveDown(0.5);
            };
            if (secA.length > 0) {
                doc.fontSize(16).text('Section A: General Disclosures', { underline: true });
                doc.moveDown();
                secA.forEach(printKpi);
                doc.moveDown();
            }
            if (secB.length > 0) {
                doc.fontSize(16).text('Section B: Management and Process Disclosures', { underline: true });
                doc.moveDown();
                secB.forEach(printKpi);
                doc.moveDown();
            }
            const pKeys = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'].filter(p => secC[p]);
            if (pKeys.length > 0) {
                doc.addPage();
                doc.fontSize(16).text('Section C: Principle-wise Performance', { underline: true });
                doc.moveDown();
                pKeys.forEach(p => {
                    doc.fontSize(14).text(`Principle ${p.replace('P', '')}`, { underline: true });
                    doc.moveDown(0.5);
                    secC[p].forEach(printKpi);
                    doc.moveDown();
                });
            }
            if (envData.ghg.length > 0 || envData.water.length > 0 || envData.waste.length > 0) {
                doc.addPage();
                doc.fontSize(16).text('Environmental Data', { underline: true });
                doc.moveDown();
                if (envData.ghg.length > 0) {
                    doc.fontSize(14).text('Energy & GHG (Scope 1, 2, 3)', { underline: true });
                    doc.moveDown(0.5);
                    envData.ghg.forEach(printKpi);
                    doc.moveDown();
                }
                if (envData.water.length > 0) {
                    doc.fontSize(14).text('Water', { underline: true });
                    doc.moveDown(0.5);
                    envData.water.forEach(printKpi);
                    doc.moveDown();
                }
                if (envData.waste.length > 0) {
                    doc.fontSize(14).text('Waste', { underline: true });
                    doc.moveDown(0.5);
                    envData.waste.forEach(printKpi);
                    doc.moveDown();
                }
            }
            doc.end();
        }
        else if (format === 'XLSX') {
            const workbook = new exceljs_1.default.Workbook();
            workbook.creator = 'MEIL ESG360';
            workbook.created = new Date();
            const createKpiSheet = (name, kpiList) => {
                if (!kpiList || kpiList.length === 0)
                    return;
                const sheet = workbook.addWorksheet(name);
                sheet.columns = [
                    { header: 'Indicator Code', key: 'code', width: 15 },
                    { header: 'Indicator Name', key: 'name', width: 40 },
                    { header: 'Value', key: 'value', width: 15 },
                    { header: 'Unit', key: 'unit', width: 15 },
                    { header: 'Principle', key: 'principle', width: 15 },
                    { header: 'Reporting Period', key: 'period', width: 25 },
                    { header: 'Contributors', key: 'contributors', width: 15 }
                ];
                sheet.getRow(1).font = { bold: true };
                sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
                kpiList.forEach(k => {
                    sheet.addRow({
                        code: k.indicator.code,
                        name: k.indicator.name,
                        value: k.value,
                        unit: k.indicator.unit,
                        principle: k.principle || 'N/A',
                        period: periodStr,
                        contributors: k.contributorsCount
                    });
                });
            };
            const coverSheet = workbook.addWorksheet('Summary');
            coverSheet.columns = [{ width: 25 }, { width: 50 }];
            coverSheet.addRow(['Report Title', reportTitle]);
            coverSheet.addRow(['Organization / Scope', report.scope.level]);
            coverSheet.addRow(['Reporting Period', periodStr]);
            coverSheet.addRow(['Date Generated', new Date().toLocaleDateString()]);
            coverSheet.addRow(['Snapshot ID', snapshot._id.toString()]);
            createKpiSheet('Section A', secA);
            createKpiSheet('Section B', secB);
            const pKeys = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'];
            pKeys.forEach(p => {
                if (secC[p] && secC[p].length > 0) {
                    createKpiSheet(`Principle ${p.replace('P', '')}`, secC[p]);
                }
            });
            createKpiSheet('GHG', envData.ghg);
            createKpiSheet('Water', envData.water);
            createKpiSheet('Waste', envData.waste);
            // Traceability sheet with all KPIs
            const traceSheet = workbook.addWorksheet('Traceability');
            traceSheet.columns = [
                { header: 'Record ID', key: 'recordId', width: 20 },
                { header: 'Indicator', key: 'indicator', width: 40 },
                { header: 'Principle', key: 'principle', width: 15 },
                { header: 'Value', key: 'value', width: 15 },
                { header: 'Unit', key: 'unit', width: 15 },
                { header: 'Evidence reference', key: 'evidence', width: 25 },
                { header: 'Reporting period', key: 'period', width: 25 }
            ];
            traceSheet.getRow(1).font = { bold: true };
            traceSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
            kpis.forEach((k) => {
                traceSheet.addRow({
                    recordId: 'Aggregated',
                    indicator: `${k.indicator.code} - ${k.indicator.name}`,
                    principle: k.indicator.brsrMappings?.[0]?.principle || 'N/A',
                    value: k.value,
                    unit: k.indicator.unit,
                    evidence: 'See system records',
                    period: periodStr
                });
            });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Report_${report.version}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        }
        else {
            res.status(400).json({ message: 'Unsupported format requested' });
        }
    }
    catch (error) {
        console.error('Export Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error exporting report' });
        }
    }
};
exports.exportReport = exportReport;
