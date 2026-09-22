import { Response } from 'express';
import BRSRCoreConfig from '../models/BRSRCoreConfig';
import ESGRecord from '../models/ESGRecord';
import ESGIndicator from '../models/ESGIndicator';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';

import { getAuthorizedProjectIds } from '../utils/hierarchy';

// @desc    Get BRSR Core Readiness & Config
// @route   GET /api/brsr-core/dashboard
// @access  Private
export const getBRSRCoreDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reportingPeriodId, scopeLevel, scopeId } = req.query;

    if (!reportingPeriodId) {
      res.status(400).json({ message: 'Reporting period is required' });
      return;
    }

    let authorizedProjectIds: mongoose.Types.ObjectId[] = [];
    if (req.user?.role !== 'ADMIN') {
      const orgIdToScope = scopeId ? new mongoose.Types.ObjectId(scopeId as string) : req.user?.organizationId;
      if (orgIdToScope) {
        authorizedProjectIds = await getAuthorizedProjectIds(orgIdToScope);
      }
    }

    const configs = await BRSRCoreConfig.find({ status: 'ACTIVE' }).populate('indicatorIds', 'code name category mandatory');
    
    // For each core attribute, fetch related records to determine status
    const dashboardData = await Promise.all(configs.map(async (config) => {
      const indicatorIds = config.indicatorIds.map((ind: any) => ind._id);
      
      let query: any = {
        reportingPeriodId: new mongoose.Types.ObjectId(reportingPeriodId as string),
        indicatorId: { $in: indicatorIds }
      };

      if (req.user?.role !== 'ADMIN') {
        query.projectId = { $in: authorizedProjectIds };
      }

      const records = await ESGRecord.find(query);

      // Enforce strict business logic: Only APPROVED records contribute to completeness metrics
      const approvedRecords = records.filter(r => r.status === 'APPROVED');
      const recordsWithData = approvedRecords.filter(r => r.value !== undefined && r.value !== null);
      const recordsWithEvidence = approvedRecords.filter(r => r.evidenceIds && r.evidenceIds.length > 0);

      // Simple heuristic for demo: If we have approved records for ALL mapped indicators, it's 'Ready'.
      // Otherwise, if we have some data but missing evidence/approvals, 'Attention'.
      // If no data, 'Missing Data'.
      
      let status = 'Missing Data';
      
      if (approvedRecords.length > 0 && approvedRecords.length >= indicatorIds.length) {
        status = 'Ready';
      } else if (recordsWithData.length > 0) {
        status = 'Attention Required';
      }

      return {
        _id: config._id,
        attributeName: config.attributeName,
        description: config.description,
        mappedIndicatorsCount: indicatorIds.length,
        status,
        metrics: {
          totalData: recordsWithData.length,
          withEvidence: recordsWithEvidence.length,
          approved: approvedRecords.length
        }
      };
    }));

    // Calculate overall core readiness
    const totalReady = dashboardData.filter(d => d.status === 'Ready').length;
    const overallReadiness = dashboardData.length > 0 ? Math.round((totalReady / dashboardData.length) * 100) : 0;

    res.json({
      overallReadiness,
      attributes: dashboardData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading BRSR Core data' });
  }
};
