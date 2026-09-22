import { Request as ExpressReq, Response as ExpressRes } from 'express';
import mongoose from 'mongoose';
import ESGRecord from '../models/ESGRecord';
import ReportingPeriod from '../models/ReportingPeriod';
import Project from '../models/Project';
import ESGIndicator from '../models/ESGIndicator';
import { calculateReadiness } from '../services/readinessService';

import { getAuthorizedProjectIds } from '../utils/hierarchy';

// Helper for RBAC filtering
const getOrgFilter = async (user: any) => {
  if (user.role === 'PROJECT_OFFICER') {
    return { organizationId: user.organizationId };
  } else if (user.role === 'BUSINESS_UNIT_REVIEWER' || user.role === 'SUBSIDIARY_MANAGER' || user.role === 'GROUP_ESG_TEAM') {
    const authorizedProjectIds = await getAuthorizedProjectIds(user.organizationId);
    return { projectId: { $in: authorizedProjectIds } };
  }
  return {}; // Admin/Auditor see all
};

// @desc    Get Analytics Overview
// @route   GET /api/analytics/overview
export const getOverview = async (req: any, res: ExpressRes) => {
  try {
    const { reportingPeriodId } = req.query;
    if (!reportingPeriodId) return res.status(400).json({ message: 'reportingPeriodId is required' });

    const orgFilter = await getOrgFilter(req.user);
    const baseMatch = { reportingPeriodId: new mongoose.Types.ObjectId(reportingPeriodId as string), ...orgFilter };

    const authorizedProjectIds = orgFilter.projectId?.$in || null;
    const readiness = await calculateReadiness(reportingPeriodId as string, authorizedProjectIds);

    const pendingApprovals = await ESGRecord.countDocuments({ ...baseMatch, status: 'SUBMITTED' });
    const validationErrors = await ESGRecord.countDocuments({ ...baseMatch, status: 'VALIDATION_FAILED' });
    const missingEvidence = await ESGRecord.countDocuments({ ...baseMatch, evidenceIds: { $size: 0 } });
    const incompleteDisclosures = await ESGRecord.countDocuments({ ...baseMatch, status: 'DRAFT' });

    res.json({
      readiness,
      attentionRequired: {
        pendingApprovals,
        validationErrors,
        missingEvidence,
        incompleteDisclosures
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching analytics overview' });
  }
};

// @desc    Get Trends (Period over Period)
// @route   GET /api/analytics/trends
export const getTrends = async (req: any, res: ExpressRes) => {
  try {
    const { indicatorId } = req.query;
    if (!indicatorId) return res.status(400).json({ message: 'indicatorId is required' });

    const orgFilter = await getOrgFilter(req.user);

    const trends = await ESGRecord.aggregate([
      { 
        $match: { 
          indicatorId: new mongoose.Types.ObjectId(indicatorId as string),
          status: 'APPROVED',
          ...orgFilter
        } 
      },
      {
        $group: {
          _id: '$reportingPeriodId',
          totalValue: { $sum: '$value' } // Assuming numeric values for simplicity
        }
      },
      {
        $lookup: {
          from: 'reportingperiods',
          localField: '_id',
          foreignField: '_id',
          as: 'period'
        }
      },
      { $unwind: '$period' },
      { $sort: { 'period.startDate': 1 } },
      {
        $project: {
          periodId: '$_id',
          periodName: '$period.name',
          financialYear: '$period.financialYear',
          value: '$totalValue'
        }
      }
    ]);

    res.json(trends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching trends' });
  }
};

// @desc    Get Contributors
// @route   GET /api/analytics/contributors
export const getContributors = async (req: any, res: ExpressRes) => {
  try {
    const { indicatorId, reportingPeriodId } = req.query;
    if (!indicatorId || !reportingPeriodId) {
      return res.status(400).json({ message: 'indicatorId and reportingPeriodId are required' });
    }

    const orgFilter = await getOrgFilter(req.user);

    const contributors = await ESGRecord.aggregate([
      {
        $match: {
          indicatorId: new mongoose.Types.ObjectId(indicatorId as string),
          reportingPeriodId: new mongoose.Types.ObjectId(reportingPeriodId as string),
          status: 'APPROVED',
          projectId: { $exists: true },
          ...orgFilter
        }
      },
      {
        $group: {
          _id: '$projectId',
          totalValue: { $sum: '$value' }
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      { $unwind: '$project' },
      {
        $project: {
          projectId: '$_id',
          projectName: '$project.name',
          projectCode: '$project.projectCode',
          value: '$totalValue'
        }
      },
      { $sort: { value: -1 } }
    ]);

    const total = contributors.reduce((sum, c) => sum + c.value, 0);
    const result = contributors.map(c => ({
      ...c,
      percentage: total > 0 ? ((c.value / total) * 100).toFixed(2) : '0'
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching contributors' });
  }
};

// @desc    Get Data Quality
// @route   GET /api/analytics/data-quality
export const getDataQuality = async (req: any, res: ExpressRes) => {
  try {
    const { reportingPeriodId } = req.query;
    const baseMatch: any = await getOrgFilter(req.user);
    if (reportingPeriodId) baseMatch.reportingPeriodId = new mongoose.Types.ObjectId(reportingPeriodId as string);

    const quality = await ESGRecord.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(quality);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching data quality' });
  }
};

// @desc    Get Anomalies
// @route   GET /api/analytics/anomalies
export const getAnomalies = async (req: any, res: ExpressRes) => {
  try {
    const { indicatorId, reportingPeriodId } = req.query;
    if (!indicatorId || !reportingPeriodId) return res.status(400).json({ message: 'Missing parameters' });

    const threshold = parseFloat(req.query.threshold as string) || 25; // 25% default

    // Fetch periods
    const periods = await ReportingPeriod.find().sort({ startDate: -1 });
    const currentPeriod = periods.find(p => p._id.toString() === reportingPeriodId);
    if (!currentPeriod) return res.status(404).json({ message: 'Reporting period not found' });
    
    const prevPeriod = periods.find(p => p.startDate < currentPeriod.startDate);

    if (!prevPeriod) {
      return res.json({ message: 'Not enough historical data for anomaly detection.' });
    }

    const orgFilter = await getOrgFilter(req.user);

    const currentRecords = await ESGRecord.aggregate([
      { $match: { indicatorId: new mongoose.Types.ObjectId(indicatorId as string), reportingPeriodId: currentPeriod._id, status: 'APPROVED', ...orgFilter } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);
    
    const prevRecords = await ESGRecord.aggregate([
      { $match: { indicatorId: new mongoose.Types.ObjectId(indicatorId as string), reportingPeriodId: prevPeriod._id, status: 'APPROVED', ...orgFilter } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);

    const currentVal = currentRecords[0]?.total || 0;
    const prevVal = prevRecords[0]?.total || 0;

    const anomalies = [];
    if (prevVal > 0) {
      const diff = Math.abs(currentVal - prevVal);
      const percentChange = (diff / prevVal) * 100;
      if (percentChange > threshold) {
        anomalies.push({
          indicatorId,
          type: currentVal > prevVal ? 'SPIKE' : 'DROP',
          message: `Significant change detected: ${currentVal > prevVal ? 'Increased' : 'Decreased'} by ${percentChange.toFixed(1)}% compared to previous period.`,
          severity: 'MEDIUM'
        });
      }
    }

    res.json(anomalies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching anomalies' });
  }
};
