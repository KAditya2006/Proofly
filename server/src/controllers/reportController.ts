import { Request, Response } from 'express';
import Report from '../models/Report';
import ReportSnapshot from '../models/ReportSnapshot';
import ReportQualityCheck from '../models/ReportQualityCheck';
import Job from '../models/Job';
import { getConsolidatedKPIs } from '../services/consolidationService';
import { calculateReadiness } from '../services/readinessService';
import mongoose from 'mongoose';
import { logAudit } from '../utils/auditLogger';
import { isAuthorizedScope, getDescendantOrgIds, getAuthorizedProjectIds } from '../utils/hierarchy';
import Project from '../models/Project';

export const generateReport = async (req: any, res: Response) => {
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
            const project = await Project.findById(scopeId);
            if (!project || project.organizationId?.toString() !== organizationId.toString()) {
                return res.status(403).json({ message: 'Unauthorized access to this project' });
            }
        } else {
            return res.status(403).json({ message: 'Unauthorized access to this BU' });
        }
      }
      allowedScopeId = scopeId || organizationId;
    } else if (role === 'SUBSIDIARY_MANAGER' || role === 'GROUP_ESG_TEAM') {
      if (role === 'SUBSIDIARY_MANAGER' && scopeLevel === 'GROUP') {
        return res.status(403).json({ message: 'Unauthorized scope for Sub Manager' });
      }
      if (scopeId && scopeId !== organizationId.toString()) {
        const isAuth = await isAuthorizedScope(organizationId, scopeId);
        if (!isAuth) {
           if (scopeLevel === 'PROJECT') {
               const project = await Project.findById(scopeId);
               if (!project || !(await isAuthorizedScope(organizationId, project.organizationId))) {
                   return res.status(403).json({ message: 'Unauthorized access to this project' });
               }
           } else {
               return res.status(403).json({ message: 'Unauthorized access to this scope' });
           }
        }
      }
      allowedScopeId = scopeId || organizationId;
    }

    const kpis = await getConsolidatedKPIs({ reportingPeriodId, scopeLevel, scopeId: allowedScopeId });

    const existingReports = await Report.find({
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
      status: 'DRAFT' as const,
      version: nextVersion,
      metadata: { kpis }
    };

    const newReport = await Report.create(reportData);

    await logAudit({
      userId: req.user._id,
      action: 'REPORT_GENERATED',
      entityType: 'Report',
      entityId: newReport._id.toString(),
      after: { version: nextVersion, scopeLevel, status: 'DRAFT' }
    });

    res.status(201).json(newReport);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A report with this version already exists. Please try again to generate the next version.' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error generating report' });
  }
};

export const getReports = async (req: any, res: Response) => {
  try {
    let query: any = {};
    if (req.user.role === 'SUBSIDIARY_MANAGER' || req.user.role === 'BUSINESS_UNIT_REVIEWER' || req.user.role === 'GROUP_ESG_TEAM') {
      const descendantOrgIds = await getDescendantOrgIds(req.user.organizationId);
      query['scope.organizationId'] = { $in: descendantOrgIds };
    }
    const reports = await Report.find(query)
      .populate('generatedBy', 'name email')
      .populate('reportingPeriodId', 'name')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching reports' });
  }
};

export const getReportById = async (req: any, res: Response) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'name email')
      .populate('reportingPeriodId', 'name');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching report' });
  }
};

export const qualityCheckReport = async (req: any, res: Response) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Mock Quality Gate logic for now
    const checkResult = await ReportQualityCheck.findOneAndUpdate(
      { reportId: report._id },
      {
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
      },
      { upsert: true, new: true }
    );

    res.json(checkResult);
  } catch (error) {
    res.status(500).json({ message: 'Server error running quality check' });
  }
};

export const submitReportReview = async (req: any, res: Response) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    if (report.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Only DRAFT reports can be submitted for review' });
    }

    report.status = 'IN_REVIEW';
    await report.save();

    await logAudit({
      userId: req.user._id,
      action: 'REPORT_SUBMITTED_REVIEW',
      entityType: 'Report',
      entityId: report._id.toString(),
      after: { status: 'IN_REVIEW' }
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error submitting review' });
  }
};

export const finalizeReport = async (req: any, res: Response) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (report.status !== 'IN_REVIEW' && report.status !== 'READY_FOR_FINALIZATION') {
      return res.status(400).json({ message: 'Report must be in IN_REVIEW or READY_FOR_FINALIZATION state to finalize' });
    }

    if (report.scope.level === 'GROUP' && req.user.role !== 'GROUP_ESG_TEAM' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized to finalize Group reports' });
    }

    let projectIds: mongoose.Types.ObjectId[] | null = null;
    if (report.scope.level === 'PROJECT') {
      projectIds = [report.scope.organizationId];
    } else if (report.scope.organizationId) {
      projectIds = await getAuthorizedProjectIds(report.scope.organizationId.toString());
    }

    const readiness = await calculateReadiness(report.reportingPeriodId.toString(), projectIds);
    if (readiness.dataCompleteness < 100) {
      return res.status(400).json({ 
        message: 'Quality Gate Failed: 100% Data Completeness is required to finalize report.',
        readiness 
      });
    }

    // Generate snapshot
    const snapshot = await ReportSnapshot.create({
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
    report.snapshotId = snapshot._id as mongoose.Types.ObjectId;
    await report.save();

    await logAudit({
      userId: req.user._id,
      action: 'REPORT_FINALIZED',
      entityType: 'Report',
      entityId: report._id.toString(),
      after: { status: 'FINALIZED', snapshotId: snapshot._id }
    });

    res.json(report);
  } catch (error) {
    console.error("Error finalizing report:", error);
    res.status(500).json({ message: 'Server error finalizing report' });
  }
};

export const archiveReport = async (req: any, res: Response) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    if (report.status !== 'FINALIZED') {
      return res.status(400).json({ message: 'Only FINALIZED reports can be archived' });
    }

    report.status = 'ARCHIVED';
    await report.save();

    await logAudit({
      userId: req.user._id,
      action: 'REPORT_ARCHIVED',
      entityType: 'Report',
      entityId: report._id.toString(),
      after: { status: 'ARCHIVED' }
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error archiving report' });
  }
};

export const getReportVersions = async (req: any, res: Response) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const versions = await Report.find({
      reportingPeriodId: report.reportingPeriodId,
      'scope.level': report.scope.level,
      'scope.organizationId': report.scope.organizationId,
      reportType: report.reportType
    }).sort({ version: -1 });

    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching versions' });
  }
};

export const compareReports = async (req: any, res: Response) => {
  try {
    res.json({ message: 'Comparison endpoint placeholder' });
  } catch (error) {
    res.status(500).json({ message: 'Server error comparing reports' });
  }
};

export const getReportLineage = async (req: any, res: Response) => {
  try {
    res.json({ message: 'Lineage trace placeholder' });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching lineage' });
  }
};

export const getEvidencePack = async (req: any, res: Response) => {
  try {
    res.json({ message: 'Evidence pack generation placeholder' });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching evidence pack' });
  }
};

export const exportReport = async (req: any, res: Response) => {
  try {
    const format = (req.query.format as string) || 'PDF';
    
    // Check for existing active job (Idempotency)
    const existingJob = await Job.findOne({
      type: 'REPORT_EXPORT',
      'metadata.reportId': req.params.id,
      'metadata.format': format,
      status: { $in: ['QUEUED', 'RUNNING'] }
    });

    if (existingJob) {
      return res.status(202).json({ message: 'Export job already in progress', jobId: existingJob._id });
    }

    const exportJob = await Job.create({
      type: 'REPORT_EXPORT',
      status: 'QUEUED',
      createdBy: req.user._id,
      metadata: {
        reportId: req.params.id,
        format: format as 'PDF' | 'XLSX' | 'CSV' | 'ZIP'
      }
    });
    
    // Simulate async processing
    setTimeout(async () => {
      try {
        await Job.updateOne(
          { _id: exportJob._id },
          { status: 'RUNNING', startedAt: new Date() }
        );
        
        // Simulate heavy work
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await Job.updateOne(
          { _id: exportJob._id },
          { 
            status: 'COMPLETED',
            result: { fileUrl: `/exports/report-${req.params.id}.${(format as string).toLowerCase()}` },
            completedAt: new Date()
          }
        );
      } catch (e) {
        await Job.updateOne(
          { _id: exportJob._id },
          { 
            status: 'FAILED',
            error: 'Rendering service unavailable',
            completedAt: new Date()
          }
        );
      }
    }, 100);

    res.status(202).json({ message: 'Export job started', jobId: exportJob._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error exporting report' });
  }
};
