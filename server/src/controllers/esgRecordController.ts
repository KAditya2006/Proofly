import { Response as ExpressRes } from 'express';
import ESGRecord from '../models/ESGRecord';
import Project from '../models/Project';
import ReportingPeriod from '../models/ReportingPeriod';
import ESGIndicator from '../models/ESGIndicator';
import { validateRecord } from '../utils/validationEngine';
import { logAudit } from '../utils/auditLogger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

import { getDescendantOrgIds, getAuthorizedProjectIds } from '../utils/hierarchy';

// Helper to check if a user is authorized for a specific project
export const isAuthorizedForProject = async (user: any, projectId: string | mongoose.Types.ObjectId): Promise<boolean> => {
  if (['ADMIN'].includes(user.role)) return true;
  
  const project = await Project.findById(projectId);
  if (!project) return false;

  if (['GROUP_ESG_TEAM', 'AUDITOR'].includes(user.role)) {
    const descendantOrgIds = await getDescendantOrgIds(user.organizationId);
    return descendantOrgIds.some(orgId => 
      orgId.toString() === project.organizationId?.toString() ||
      orgId.toString() === project.subsidiaryId?.toString() ||
      orgId.toString() === project.businessUnitId?.toString()
    );
  }

  if (user.role === 'PROJECT_OFFICER') {
    return project.assignedOfficers?.map(id => id.toString()).includes(user._id.toString()) || false;
  }
  if (user.role === 'BUSINESS_UNIT_REVIEWER') {
    return project.businessUnitId?.toString() === user.organizationId.toString();
  }
  if (user.role === 'SUBSIDIARY_MANAGER') {
    return project.subsidiaryId?.toString() === user.organizationId.toString();
  }
  
  return false;
};

// @desc    Get ESG Records based on role
// @route   GET /api/esg/records
// @access  Private
export const getRecords = async (req: AuthRequest, res: ExpressRes): Promise<void> => {
  try {
    if (!req.user) return;
    const { role, _id, organizationId } = req.user;
    let query: Record<string, unknown> = {};

    if (role === 'PROJECT_OFFICER') {
      const assignedProjects = await Project.find({ assignedOfficers: _id }).select('_id');
      query.projectId = { $in: assignedProjects.map(p => p._id) };
    } else if (role === 'BUSINESS_UNIT_REVIEWER') {
      const buProjects = await Project.find({ businessUnitId: organizationId }).select('_id');
      query.projectId = { $in: buProjects.map(p => p._id) };
      // Reviewers only see submitted and beyond
      query.status = { $in: ['SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED', 'REJECTED'] };
    } else if (role === 'SUBSIDIARY_MANAGER') {
      const subProjects = await Project.find({ subsidiaryId: organizationId }).select('_id');
      query.projectId = { $in: subProjects.map(p => p._id) };
      // Managers usually see all states or just submitted
    } else if (['GROUP_ESG_TEAM', 'AUDITOR'].includes(role)) {
      const authorizedProjectIds = await getAuthorizedProjectIds(organizationId);
      query.projectId = { $in: authorizedProjectIds };
      if (role === 'AUDITOR') {
        query.status = 'APPROVED';
      }
    }

    if (req.query.indicatorId) {
      query.indicatorId = req.query.indicatorId;
    }
    if (req.query.reportingPeriodId) {
      query.reportingPeriodId = req.query.reportingPeriodId;
    }
    if (req.query.projectId) {
      // Ensure they don't bypass role-based projectId filter
      if (query.projectId && typeof query.projectId === 'object' && '$in' in query.projectId) {
        const allowedIds = (query.projectId as any).$in.map((id: any) => id.toString());
        if (allowedIds.includes(req.query.projectId as string)) {
          query.projectId = req.query.projectId;
        } else {
           res.status(403).json({ message: 'Not authorized for this project' });
           return;
        }
      } else {
        query.projectId = req.query.projectId;
      }
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const total = await ESGRecord.countDocuments(query);
    const records = await ESGRecord.find(query)
      .populate('indicatorId')
      .populate('projectId', 'name projectCode')
      .populate('reportingPeriodId', 'name financialYear')
      .populate('evidenceIds', 'name fileUrl')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: records,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching ESG records' });
  }
};

// @desc    Get record by ID
// @route   GET /api/esg/records/:id
// @access  Private
export const getRecordById = async (req: AuthRequest, res: ExpressRes): Promise<void> => {
  try {
    const record = await ESGRecord.findById(req.params.id)
      .populate('indicatorId')
      .populate('projectId')
      .populate('reportingPeriodId')
      .populate('evidenceIds')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!record) {
      throw new AppError('Record not found', 404, 'NOT_FOUND');
    }

    if (!(await isAuthorizedForProject(req.user, (record.projectId as any)?._id || record.projectId))) {
      throw new AppError('Not authorized to access this record', 403, 'FORBIDDEN');
    }
    res.json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching ESG record' });
  }
};

// @desc    Create draft ESG Record
// @route   POST /api/esg/records
// @access  Private (Officer)
export const createRecord = async (req: AuthRequest, res: ExpressRes): Promise<void> => {
  try {
    if (!req.user) return;
    const { projectId, indicatorId, reportingPeriodId, value, unit, source, calculationMethod, remarks, evidenceIds, comments } = req.body;
    
    if (!projectId || !indicatorId || !reportingPeriodId || value === undefined || !unit) {
      throw new AppError('Missing mandatory fields', 400, 'INVALID_INPUT');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError('Invalid project ID', 400, 'INVALID_INPUT');
    }

    if (!(await isAuthorizedForProject(req.user, project._id))) {
      throw new AppError('Not authorized to create records for this project', 403, 'FORBIDDEN');
    }

    // Verify ReportingPeriod
    const period = await ReportingPeriod.findById(reportingPeriodId);
    if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
      throw new AppError('Reporting period is invalid or closed', 400, 'INVALID_PERIOD');
    }

    // Verify Indicator
    const indicator = await ESGIndicator.findById(indicatorId);
    if (!indicator || indicator.status !== 'ACTIVE') {
      throw new AppError('Indicator is invalid or inactive', 400, 'INVALID_INDICATOR');
    }

    // Duplicate check
    const existingRecord = await ESGRecord.findOne({
      projectId,
      indicatorId,
      reportingPeriodId
    });
    
    if (existingRecord) {
      res.status(409).json({ message: 'ESG Record for this indicator and period already exists' });
      return;
    }

    const newRecord = new ESGRecord({
      indicatorId,
      projectId,
      reportingPeriodId,
      value,
      unit,
      source,
      calculationMethod,
      remarks,
      evidenceIds,
      comments,
      organizationId: project.organizationId,
      status: 'DRAFT',
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    const savedRecord = await newRecord.save();

    await logAudit({
      userId: req.user._id,
      action: 'CREATE_RECORD',
      entityType: 'ESGRecord',
      entityId: savedRecord._id.toString(),
      after: savedRecord.toObject() as unknown as Record<string, unknown>,
      ipAddress: req.ip
    });

    res.status(201).json(savedRecord);
  } catch (error: any) {
    console.error(error);
    if (error instanceof AppError || error.statusCode) {
      res.status(error.statusCode || 400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error creating ESG record' });
    }
  }
};

// @desc    Update ESG Record
// @route   PUT /api/esg/records/:id
// @access  Private (Officer)
export const updateRecord = async (req: AuthRequest, res: ExpressRes): Promise<void> => {
  try {
    if (!req.user) return;
    const record = await ESGRecord.findById(req.params.id);
    if (!record) {
      throw new AppError('Record not found', 404, 'NOT_FOUND');
    }

    if (!(await isAuthorizedForProject(req.user, (record.projectId as any)?._id || record.projectId))) {
      throw new AppError('Not authorized to update this record', 403, 'FORBIDDEN');
    }

    if (!['DRAFT', 'VALIDATION_FAILED', 'CORRECTION_REQUIRED'].includes(record.status)) {
      res.status(400).json({ message: 'Cannot update record in current status' });
      return;
    }

    // Verify ReportingPeriod
    const ReportingPeriod = mongoose.model('ReportingPeriod');
    const period = await ReportingPeriod.findById(record.reportingPeriodId);
    if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
      throw new AppError('Reporting period is closed, cannot update records', 400, 'INVALID_PERIOD');
    }

    const before = record.toObject();

    // Only allow updating safe fields
    const { value, unit, source, calculationMethod, remarks, evidenceIds, comments } = req.body;
    
    if (value !== undefined) record.value = value;
    if (unit !== undefined) record.unit = unit;
    if (source !== undefined) record.source = source;
    if (calculationMethod !== undefined) record.calculationMethod = calculationMethod;
    if (remarks !== undefined) record.remarks = remarks;
    if (evidenceIds !== undefined) record.evidenceIds = evidenceIds;
    if (comments !== undefined) record.comments = comments;

    record.updatedBy = req.user._id;
    
    // If it was correction required or validation failed, moving it back to draft phase
    if (record.status === 'CORRECTION_REQUIRED' || record.status === 'VALIDATION_FAILED') {
      record.status = 'DRAFT';
    }

    const savedRecord = await record.save();

    await logAudit({
      userId: req.user._id,
      action: 'UPDATE_RECORD',
      entityType: 'ESGRecord',
      entityId: savedRecord._id.toString(),
      before: before as unknown as Record<string, unknown>,
      after: savedRecord.toObject() as unknown as Record<string, unknown>,
      ipAddress: req.ip
    });

    res.json(savedRecord);
  } catch (error: any) {
    console.error(error);
    if (error instanceof AppError || error.statusCode) {
      res.status(error.statusCode || 400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error updating ESG record' });
    }
  }
};

// @desc    Validate ESG Record
// @route   POST /api/esg/records/:id/validate
// @access  Private
export const validateRecordEndpoint = async (req: AuthRequest, res: ExpressRes): Promise<void> => {
  try {
    if (!req.user) return;
    const record = await ESGRecord.findById(req.params.id);
    if (!record) {
      throw new AppError('Record not found', 404, 'NOT_FOUND');
    }

    if (!(await isAuthorizedForProject(req.user, (record.projectId as any)?._id || record.projectId))) {
      throw new AppError('Not authorized to validate this record', 403, 'FORBIDDEN');
    }

    const validation = await validateRecord(record);

    record.status = validation.isValid ? 'DRAFT' : 'VALIDATION_FAILED';
    record.updatedBy = req.user._id;
    await record.save();

    await logAudit({
      userId: req.user._id,
      action: validation.isValid ? 'VALIDATION_PASSED' : 'VALIDATION_FAILED',
      entityType: 'ESGRecord',
      entityId: record._id,
      after: { isValid: validation.isValid, errors: validation.errors },
      ipAddress: req.ip
    });

    res.json({ record, validation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error validating ESG record' });
  }
};

// @desc    Submit ESG Record
// @route   POST /api/esg/records/:id/submit
// @access  Private (Officer)
export const submitRecord = async (req: AuthRequest, res: ExpressRes): Promise<void> => {
  try {
    if (!req.user) return;
    const record = await ESGRecord.findById(req.params.id).populate('indicatorId');
    if (!record) {
      throw new AppError('Record not found', 404, 'NOT_FOUND');
    }

    if (!(await isAuthorizedForProject(req.user, (record.projectId as any)?._id || record.projectId))) {
      throw new AppError('Not authorized to submit this record', 403, 'FORBIDDEN');
    }

    if (record.status !== 'DRAFT') {
      res.status(400).json({ message: 'Record must be a DRAFT before submission. (Please validate again if validation failed)' });
      return;
    }

    // Verify ReportingPeriod
    const ReportingPeriod = mongoose.model('ReportingPeriod');
    const period = await ReportingPeriod.findById(record.reportingPeriodId);
    console.log('Submit Record Period Debug:', record.reportingPeriodId, period);
    if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
      throw new AppError('Reporting period is closed, cannot submit records', 400, 'INVALID_PERIOD');
    }

    // Run validation Engine before submitting
    const validation = await validateRecord(record);
    if (!validation.isValid) {
      record.status = 'VALIDATION_FAILED';
      record.updatedBy = req.user._id;
      await record.save();

      await logAudit({
        userId: req.user._id,
        action: 'VALIDATION_FAILED_ON_SUBMIT',
        entityType: 'ESGRecord',
        entityId: record._id,
        after: { errors: validation.errors },
        ipAddress: req.ip
      });

      res.status(400).json({ 
        message: 'Validation failed, cannot submit.', 
        errors: validation.errors 
      });
      return;
    }

    record.status = 'SUBMITTED';
    record.submittedBy = req.user._id;
    record.updatedBy = req.user._id;
    await record.save();

    await logAudit({
      userId: req.user._id,
      action: 'SUBMIT_RECORD',
      entityType: 'ESGRecord',
      entityId: record._id,
      ipAddress: req.ip
    });

    res.json(record);
  } catch (error: any) {
    console.error(error);
    if (error instanceof AppError || error.statusCode) {
      res.status(error.statusCode || 400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error submitting ESG record' });
    }
  }
};
