import { Request, Response } from 'express';
import mongoose from 'mongoose';
import AssuranceSample from '../models/AssuranceSample';
import AssuranceFinding from '../models/AssuranceFinding';
import ESGRecord from '../models/ESGRecord';
import AuditLog from '../models/AuditLog';
import { getAuthorizedProjectIds } from '../utils/hierarchy';

// Fetch all assurance samples for a given reporting period
export const getSamples = async (req: any, res: Response) => {
  try {
    const { reportingPeriodId } = req.query;
    if (!reportingPeriodId) return res.status(400).json({ message: 'reportingPeriodId is required' });

    let query: any = { reportingPeriodId };
    
    // Fetch authorized project IDs and bound the samples
    if (req.user?.role !== 'ADMIN') {
      const authorizedProjectIds = await getAuthorizedProjectIds(req.user.organizationId);
      const authorizedRecords = await ESGRecord.find({ projectId: { $in: authorizedProjectIds } }).select('_id');
      query.recordId = { $in: authorizedRecords.map(r => r._id) };
    }

    const samples = await AssuranceSample.find(query)
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
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Select a new sample for assurance
export const createSample = async (req: any, res: Response) => {
  try {
    const { recordId, reportingPeriodId, reason } = req.body;
    
    // Ensure the record exists
    const record = await ESGRecord.findById(recordId);
    if (!record) return res.status(404).json({ message: 'ESG Record not found' });

    if (record.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Only APPROVED records can be sampled for assurance.' });
    }

    if (req.user?.role !== 'ADMIN') {
      const authorizedProjectIds = await getAuthorizedProjectIds(req.user.organizationId);
      if (!authorizedProjectIds.some(pid => pid.toString() === record.projectId?.toString())) {
        return res.status(403).json({ message: 'Not authorized to sample this record.' });
      }
    }

    const existingSample = await AssuranceSample.findOne({ recordId });
    if (existingSample) return res.status(400).json({ message: 'Record is already sampled' });

    const sample = await AssuranceSample.create({
      recordId,
      reportingPeriodId,
      selectedBy: req.user?._id,
      reason,
      status: 'SELECTED'
    });

    await AuditLog.create({
      action: 'CREATE',
      entityType: 'AssuranceSample',
      entityId: sample._id,
      userId: req.user?._id
    });

    res.status(201).json(sample);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateSampleStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const sample = await AssuranceSample.findById(id).populate('recordId');
    if (!sample) return res.status(404).json({ message: 'Sample not found' });

    if (req.user?.role !== 'ADMIN') {
      const authorizedProjectIds = await getAuthorizedProjectIds(req.user.organizationId);
      const record = sample.recordId as any;
      if (!authorizedProjectIds.some(pid => pid.toString() === record.projectId?.toString())) {
        return res.status(403).json({ message: 'Not authorized to modify this sample.' });
      }
    }

    sample.status = status;
    await sample.save();

    res.json(sample);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Fetch findings
export const getFindings = async (req: any, res: Response) => {
  try {
    const { reportingPeriodId } = req.query;
    let query: any = {};
    if (reportingPeriodId) query.reportingPeriodId = reportingPeriodId;

    if (req.user?.role !== 'ADMIN') {
      const authorizedProjectIds = await getAuthorizedProjectIds(req.user.organizationId);
      const authorizedRecords = await ESGRecord.find({ projectId: { $in: authorizedProjectIds } }).select('_id');
      query.recordId = { $in: authorizedRecords.map(r => r._id) };
    }

    const findings = await AssuranceFinding.find(query)
      .populate('sampleId')
      .populate({ path: 'recordId', populate: { path: 'projectId indicatorId' } })
      .populate('createdBy', 'name role')
      .populate('resolvedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(findings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createFinding = async (req: any, res: Response) => {
  try {
    const { sampleId, findingTitle, description, severity } = req.body;

    const sample = await AssuranceSample.findById(sampleId).populate('recordId');
    if (!sample) return res.status(404).json({ message: 'Sample not found' });

    if (req.user?.role !== 'ADMIN') {
      const authorizedProjectIds = await getAuthorizedProjectIds(req.user.organizationId);
      const record = sample.recordId as any;
      if (!authorizedProjectIds.some(pid => pid.toString() === record.projectId?.toString())) {
        return res.status(403).json({ message: 'Not authorized to create a finding for this sample.' });
      }
    }

    const finding = await AssuranceFinding.create({
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

    await AuditLog.create({
      action: 'CREATE',
      entityType: 'AssuranceFinding',
      entityId: finding._id,
      userId: req.user?._id
    });

    res.status(201).json(finding);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const resolveFinding = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { resolutionRemarks } = req.body;

    const finding = await AssuranceFinding.findById(id).populate('recordId');
    if (!finding) return res.status(404).json({ message: 'Finding not found' });

    if (req.user?.role !== 'ADMIN') {
      const authorizedProjectIds = await getAuthorizedProjectIds(req.user.organizationId);
      const record = finding.recordId as any;
      if (!authorizedProjectIds.some(pid => pid.toString() === record.projectId?.toString())) {
        return res.status(403).json({ message: 'Not authorized to resolve this finding.' });
      }
    }

    finding.status = 'RESOLVED';
    finding.resolvedBy = req.user?._id as mongoose.Types.ObjectId;
    finding.resolutionRemarks = resolutionRemarks;
    await finding.save();

    await AuditLog.create({
      action: 'UPDATE',
      entityType: 'AssuranceFinding',
      entityId: finding._id,
      userId: req.user?._id
    });

    res.json(finding);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
