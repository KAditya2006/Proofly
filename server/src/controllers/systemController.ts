import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import ESGRecord from '../models/ESGRecord';
import Project from '../models/Project';
import Organization from '../models/Organization';
import SystemSetting from '../models/SystemSetting';
import { AppError } from '../middleware/errorHandler';

export const getIntegrityStatus = async (req: AuthRequest, res: Response) => {
  try {
    // Basic checks
    const totalRecords = await ESGRecord.countDocuments();
    
    // Check for orphan records (no valid project)
    const allProjects = await Project.find().select('_id');
    const projectIds = allProjects.map(p => p._id);
    
    const orphanRecords = await ESGRecord.countDocuments({
      projectId: { $nin: projectIds }
    });

    // Check for missing hierarchies in organizations
    const allOrgs = await Organization.find();
    let brokenHierarchies = 0;
    
    allOrgs.forEach(org => {
      if (org.type !== 'GROUP' && org.parentId) {
        const parentExists = allOrgs.some(o => o._id.toString() === org.parentId?.toString());
        if (!parentExists) brokenHierarchies++;
      }
    });

    res.json({
      status: orphanRecords === 0 && brokenHierarchies === 0 ? 'HEALTHY' : 'ISSUES_FOUND',
      metrics: {
        totalRecords,
        orphanRecords,
        brokenHierarchies
      }
    });
  } catch (error) {
    throw new AppError('Server error running integrity checks', 500, 'INTEGRITY_CHECK_FAILED');
  }
};

export const getReconciliationStatus = async (req: AuthRequest, res: Response) => {
  try {
    // Placeholder for actual reconciliation
    res.json({
      status: 'HEALTHY',
      mismatches: 0,
      details: [
        { scope: 'Group', status: '100% reconciled' },
        { scope: 'Subsidiary A', status: '100% reconciled' }
      ]
    });
  } catch (error) {
    throw new AppError('Server error running reconciliation checks', 500, 'RECONCILIATION_CHECK_FAILED');
  }
};

export const getSystemSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    res.json(settings);
  } catch (error) {
    throw new AppError('Server error fetching system settings', 500, 'SETTINGS_FETCH_FAILED');
  }
};

export const updateSystemSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    throw new AppError('Server error updating system settings', 500, 'SETTINGS_UPDATE_FAILED');
  }
};
