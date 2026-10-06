import { Request as ExpressReq, Response as ExpressRes } from 'express';
import Evidence from '../models/Evidence';
import ESGRecord from '../models/ESGRecord';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logAudit } from '../utils/auditLogger';
import { getAuthorizedProjectIds } from '../utils/hierarchy';

// Note: File upload middleware (multer) should be applied in the route before this controller.
// req.file will be populated.

// @desc    Upload evidence file
// @route   POST /api/evidence
// @access  Private (Officer)
export const uploadEvidence = async (req: any, res: ExpressRes) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { projectId, reportingPeriodId, indicatorId } = req.body;

    if (!projectId || !reportingPeriodId) {
      // In a real app we'd also clean up the uploaded file if validation fails here
      if (req.file.path) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Missing required context (Project, Reporting Period)' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Calculate SHA-256 Hash
    const fileBuffer = fs.readFileSync(req.file.path);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const contentHash = hashSum.digest('hex');
    
    const newEvidence = new Evidence({
      name: req.file.originalname,
      fileUrl,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      projectId,
      reportingPeriodId,
      indicatorId,
      uploadedBy: req.user._id,
      hashAlgorithm: 'SHA-256',
      contentHash
    });

    const savedEvidence = await newEvidence.save();

    await logAudit({
      userId: req.user._id,
      action: 'UPLOAD_EVIDENCE',
      entityType: 'Evidence',
      entityId: savedEvidence._id,
      after: savedEvidence.toObject() as unknown as Record<string, unknown>,
      ipAddress: req.ip
    });

    res.status(201).json(savedEvidence);
  } catch (error) {
    console.error(error);
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error uploading evidence' });
  }
};

// @desc    Delete evidence file
// @route   DELETE /api/evidence/:id
// @access  Private (Officer)
export const deleteEvidence = async (req: any, res: ExpressRes) => {
  try {
    const evidence = await Evidence.findById(req.params.id);
    
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    // Check if it's attached to a non-draft record
    const linkedRecords = await ESGRecord.find({ evidenceIds: evidence._id });
    const isLocked = linkedRecords.some(r => !['DRAFT', 'CORRECTION_REQUIRED', 'VALIDATION_FAILED'].includes(r.status));
    
    if (isLocked) {
      return res.status(400).json({ message: 'Cannot delete evidence linked to a submitted or approved record' });
    }

    const filePath = path.join(__dirname, '../../', evidence.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from linked records
    if (linkedRecords.length > 0) {
      for (const record of linkedRecords) {
        record.evidenceIds = record.evidenceIds.filter((id: any) => id.toString() !== evidence._id.toString());
        await record.save();
      }
    }

    await evidence.deleteOne();

    await logAudit({
      userId: req.user._id,
      action: 'DELETE_EVIDENCE',
      entityType: 'Evidence',
      entityId: evidence._id,
      before: evidence.toObject() as unknown as Record<string, unknown>,
      ipAddress: req.ip
    });

    res.json({ message: 'Evidence removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting evidence' });
  }
};

// @desc    Get evidence metadata by project and period
// @route   GET /api/evidence
// @access  Private
export const getEvidence = async (req: any, res: ExpressRes) => {
  try {
    const { projectId, reportingPeriodId } = req.query;
    
    let query: any = {};
    if (projectId) query.projectId = projectId;
    if (reportingPeriodId) query.reportingPeriodId = reportingPeriodId;

    if (req.user.role !== 'ADMIN') {
      const authorizedProjectIds = await getAuthorizedProjectIds(req.user.organizationId);
      if (query.projectId) {
        if (!authorizedProjectIds.some(id => id.toString() === query.projectId.toString())) {
          return res.status(403).json({ message: 'Not authorized for this project' });
        }
      } else {
        query.projectId = { $in: authorizedProjectIds };
      }
    }
    
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const total = await Evidence.countDocuments(query);
    const evidence = await Evidence.find(query)
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching evidence' });
  }
};

// @desc    Get evidence coverage statistics
// @route   GET /api/evidence/coverage
// @access  Private
export const getCoverage = async (req: any, res: ExpressRes) => {
  try {
    const { reportingPeriodId } = req.query;
    if (!reportingPeriodId) return res.status(400).json({ message: 'reportingPeriodId is required' });

    let recordQuery: any = { reportingPeriodId };
    
    if (req.user.role !== 'ADMIN') {
      const authorizedProjectIds = await getAuthorizedProjectIds(req.user.organizationId);
      recordQuery.projectId = { $in: authorizedProjectIds };
    }

    const totalRecords = await ESGRecord.countDocuments(recordQuery);
    const recordsWithEvidence = await ESGRecord.countDocuments({ 
      ...recordQuery,
      'evidenceIds.0': { $exists: true } 
    });

    const coverage = totalRecords === 0 ? 'N/A' : ((recordsWithEvidence / totalRecords) * 100).toFixed(2);

    res.json({
      totalRecords,
      recordsWithEvidence,
      coveragePercent: coverage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error calculating evidence coverage' });
  }
};

// @desc    Get evidence gap report
// @route   GET /api/evidence/gaps
// @access  Private
export const getGaps = async (req: any, res: ExpressRes) => {
  try {
    const { reportingPeriodId } = req.query;
    if (!reportingPeriodId) return res.status(400).json({ message: 'reportingPeriodId is required' });

    let query: any = {
      reportingPeriodId,
      'evidenceIds': { $size: 0 }
    };

    if (req.user.role !== 'ADMIN') {
      const authorizedProjectIds = await getAuthorizedProjectIds(req.user.organizationId);
      query.projectId = { $in: authorizedProjectIds };
    }

    // Records missing evidence
    const gaps = await ESGRecord.find(query)
    .populate('projectId', 'name projectCode')
    .populate('indicatorId', 'name code')
    .populate('organizationId', 'name')
    .sort({ createdAt: -1 });

    res.json(gaps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating evidence gap report' });
  }
};

// @desc    Verify evidence integrity using SHA-256
// @route   POST /api/evidence/:id/verify
// @access  Private (Assurance/Admin)
export const verifyEvidence = async (req: any, res: ExpressRes) => {
  try {
    const evidence = await Evidence.findById(req.params.id);
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    // RBAC: Check if user is authorized for the project this evidence belongs to
    if (req.user.role !== 'ADMIN') {
      const { getAuthorizedProjectIds } = await import('../utils/hierarchy');
      const authorizedProjectIds = await getAuthorizedProjectIds(req.user.organizationId);
      if (!authorizedProjectIds.some(id => id.toString() === evidence.projectId.toString())) {
        return res.status(403).json({ message: 'Not authorized to verify evidence for this project' });
      }
    }

    const filePath = path.join(__dirname, '../../', evidence.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        message: 'Original file not found on disk. Cannot perform verification.',
        status: 'VERIFICATION FAILED'
      });
    }

    // Re-calculate hash
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const currentHash = hashSum.digest('hex');

    const isMatch = currentHash === evidence.contentHash;
    const verificationStatus = isMatch ? 'VERIFIED' : 'MISMATCH';

    // Log the verification attempt
    await logAudit({
      userId: req.user._id,
      action: 'VERIFY_EVIDENCE',
      entityType: 'Evidence',
      entityId: evidence._id,
      after: { 
        storedHash: evidence.contentHash, 
        currentHash, 
        status: verificationStatus 
      },
      ipAddress: req.ip
    });

    res.json({
      evidenceId: evidence._id,
      name: evidence.name,
      storedHash: evidence.contentHash,
      currentHash,
      algorithm: 'SHA-256',
      status: verificationStatus,
      timestamp: new Date()
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error verifying evidence integrity' });
  }
};
