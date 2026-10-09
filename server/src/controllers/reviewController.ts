import { Request as ExpressReq, Response as ExpressRes } from 'express';
import mongoose from 'mongoose';
import ESGRecord from '../models/ESGRecord';
import Project from '../models/Project';
import ReportingPeriod from '../models/ReportingPeriod';
import { logAudit } from '../utils/auditLogger';
import { isAuthorizedForProject } from './esgRecordController';
import { AppError } from '../middleware/errorHandler';
import { sendWorkflowNotification } from '../utils/emailService';
// @desc    Get pending reviews
// @route   GET /api/reviews
// @access  Private (Reviewers/Managers)
export const getPendingReviews = async (req: any, res: ExpressRes) => {
  try {
    const { role, organizationId } = req.user;
    let query: any = {};

    // Reviewers see SUBMITTED or UNDER_REVIEW records for their scope
    query.status = { $in: ['SUBMITTED', 'UNDER_REVIEW'] };

    if (role === 'BUSINESS_UNIT_REVIEWER') {
      const buProjects = await Project.find({ businessUnitId: organizationId }).select('_id');
      query.projectId = { $in: buProjects.map(p => p._id) };
    } else if (role === 'SUBSIDIARY_MANAGER') {
      const subProjects = await Project.find({ subsidiaryId: organizationId }).select('_id');
      query.projectId = { $in: subProjects.map(p => p._id) };
    }

    const reviews = await ESGRecord.find(query)
      .populate('indicatorId')
      .populate('projectId', 'name projectCode')
      .populate('reportingPeriodId', 'name financialYear')
      .populate('submittedBy', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    const SLA_HOURS = Number(process.env.SLA_HOURS || 48);
    const now = new Date();

    const reviewsWithSLA = reviews.map((r: any) => {
      let slaStatus = 'ON_TIME';
      let ageHours = 0;

      if (r.submittedAt) {
        ageHours = (now.getTime() - new Date(r.submittedAt).getTime()) / (1000 * 60 * 60);
        if (ageHours > SLA_HOURS) {
          slaStatus = 'OVERDUE';
        } else if (ageHours > SLA_HOURS * 0.75) {
          slaStatus = 'APPROACHING_SLA';
        }
      }

      return {
        ...r,
        slaStatus,
        ageHours
      };
    });

    res.json(reviewsWithSLA);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching pending reviews' });
  }
};

// @desc    Approve Submission
// @route   POST /api/reviews/:id/approve
// @access  Private (Reviewer)
export const approveSubmission = async (req: any, res: ExpressRes) => {
  try {
    const record = await ESGRecord.findById(req.params.id);
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');

    if (!(await isAuthorizedForProject(req.user, (record.projectId as any)?._id || record.projectId))) {
      throw new AppError('Not authorized to approve this record', 403, 'FORBIDDEN');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(record.status)) {
      throw new AppError('Record is not in a reviewable state', 400, 'INVALID_STATE');
    }

    const period = await ReportingPeriod.findById(record.reportingPeriodId);
    if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
      throw new AppError('Reporting period is closed or archived', 400, 'INVALID_PERIOD_STATE');
    }

    record.status = 'APPROVED';
    record.approvedBy = req.user._id;
    record.approvedAt = new Date();
    record.updatedBy = req.user._id;
    await record.save();

    await logAudit({
      userId: req.user._id,
      action: 'APPROVE_RECORD',
      entityType: 'ESGRecord',
      entityId: record._id,
      ipAddress: req.ip
    });

    await record.populate(['indicatorId', 'submittedBy']);
    const submittedBy: any = record.submittedBy;
    if (submittedBy && submittedBy.email) {
      sendWorkflowNotification(submittedBy.email, 'Record Approved', {
        indicatorName: (record.indicatorId as any)?.name || 'ESG Indicator',
        status: 'APPROVED',
        comment: 'Approved by reviewer',
        actionBy: req.user.name
      });
    }

    res.json(record);
  } catch (error: any) {
    console.error('Approve Error:', error);
    if (error instanceof AppError || error.statusCode) {
      res.status(error.statusCode || 400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error approving submission' });
    }
  }
};

// @desc    Request Correction
// @route   POST /api/reviews/:id/correction
// @access  Private (Reviewer)
export const requestCorrection = async (req: any, res: ExpressRes) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (!reason) throw new AppError('Correction reason is required', 400, 'BAD_REQUEST');

    const record = await ESGRecord.findById(req.params.id);
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');

    if (!(await isAuthorizedForProject(req.user, (record.projectId as any)?._id || record.projectId))) {
      throw new AppError('Not authorized to request correction for this record', 403, 'FORBIDDEN');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(record.status)) {
      throw new AppError('Record is not in a reviewable state', 400, 'INVALID_STATE');
    }

    const period = await ReportingPeriod.findById(record.reportingPeriodId);
    if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
      throw new AppError('Reporting period is closed or archived', 400, 'INVALID_PERIOD_STATE');
    }

    record.status = 'CORRECTION_REQUIRED';
    record.correctionReason = reason;
    record.updatedBy = req.user._id;
    await record.save();

    await logAudit({
      userId: req.user._id,
      action: 'REQUEST_CORRECTION',
      entityType: 'ESGRecord',
      entityId: record._id,
      after: { reason },
      ipAddress: req.ip
    });

    await record.populate(['indicatorId', 'submittedBy']);
    const submittedBy: any = record.submittedBy;
    if (submittedBy && submittedBy.email) {
      sendWorkflowNotification(submittedBy.email, 'Correction Required', {
        indicatorName: (record.indicatorId as any)?.name || 'ESG Indicator',
        status: 'CORRECTION_REQUIRED',
        comment: reason,
        actionBy: req.user.name
      });
    }

    res.json(record);
  } catch (error: any) {
    console.error('Correction Error:', error);
    if (error instanceof AppError || error.statusCode) {
      res.status(error.statusCode || 400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error requesting correction' });
    }
  }
};

// @desc    Reject Submission
// @route   POST /api/reviews/:id/reject
// @access  Private (Reviewer)
export const rejectSubmission = async (req: any, res: ExpressRes) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (!reason) throw new AppError('Rejection reason is required', 400, 'BAD_REQUEST');

    const record = await ESGRecord.findById(req.params.id);
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');

    if (!(await isAuthorizedForProject(req.user, (record.projectId as any)?._id || record.projectId))) {
      throw new AppError('Not authorized to reject this record', 403, 'FORBIDDEN');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(record.status)) {
      throw new AppError('Record is not in a reviewable state', 400, 'INVALID_STATE');
    }

    const period = await ReportingPeriod.findById(record.reportingPeriodId);
    if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
      throw new AppError('Reporting period is closed or archived', 400, 'INVALID_PERIOD_STATE');
    }

    record.status = 'REJECTED';
    record.correctionReason = reason;
    record.updatedBy = req.user._id;
    await record.save();

    await logAudit({
      userId: req.user._id,
      action: 'REJECT_RECORD',
      entityType: 'ESGRecord',
      entityId: record._id,
      after: { reason },
      ipAddress: req.ip
    });

    await record.populate(['indicatorId', 'submittedBy']);
    const submittedBy: any = record.submittedBy;
    if (submittedBy && submittedBy.email) {
      sendWorkflowNotification(submittedBy.email, 'Record Rejected', {
        indicatorName: (record.indicatorId as any)?.name || 'ESG Indicator',
        status: 'REJECTED',
        comment: reason,
        actionBy: req.user.name
      });
    }

    res.json(record);
  } catch (error: any) {
    console.error('Rejection Error:', error);
    if (error instanceof AppError || error.statusCode) {
      res.status(error.statusCode || 400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error rejecting submission' });
    }
  }
};

// @desc    Escalate Submission to higher authority
// @route   POST /api/reviews/:id/escalate
// @access  Private (Reviewer)
export const escalateSubmission = async (req: any, res: ExpressRes) => {
  try {
    const record = await ESGRecord.findById(req.params.id);
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');

    if (!(await isAuthorizedForProject(req.user, (record.projectId as any)?._id || record.projectId))) {
      throw new AppError('Not authorized to escalate this record', 403, 'FORBIDDEN');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(record.status)) {
      throw new AppError('Record is not in a reviewable state', 400, 'INVALID_STATE');
    }

    const period = await ReportingPeriod.findById(record.reportingPeriodId);
    if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
      throw new AppError('Reporting period is closed or archived', 400, 'INVALID_PERIOD_STATE');
    }

    record.status = 'UNDER_REVIEW'; // Keep or set to UNDER_REVIEW to escalate
    record.buApprovedBy = req.user._id;
    record.buApprovedAt = new Date();
    record.updatedBy = req.user._id;
    await record.save();

    await logAudit({
      userId: req.user._id,
      action: 'ESCALATE_RECORD',
      entityType: 'ESGRecord',
      entityId: record._id,
      ipAddress: req.ip
    });

    res.json(record);
  } catch (error: any) {
    console.error('Escalation Error:', error);
    if (error instanceof AppError || error.statusCode) {
      res.status(error.statusCode || 400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error escalating submission' });
    }
  }
};
