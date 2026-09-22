import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import AuditLog from '../models/AuditLog';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { getDescendantOrgIds } from '../utils/hierarchy';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { action, entityType, startDate, endDate, userId } = req.query;
    
    const query: any = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (userId) query.userId = userId;

    if (req.user?.role !== 'ADMIN') {
      const descendantOrgIds = await getDescendantOrgIds(req.user!.organizationId);
      const authorizedUsers = await User.find({ organizationId: { $in: descendantOrgIds } }).select('_id');
      const authorizedUserIds = authorizedUsers.map(u => u._id.toString());
      if (query.userId) {
        if (!authorizedUserIds.includes(query.userId.toString())) {
          return res.status(403).json({ message: 'Not authorized for this user' });
        }
      } else {
        query.userId = { $in: authorizedUserIds };
      }
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json({
      data: logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    throw new AppError('Server error fetching audit logs', 500, 'FETCH_AUDIT_LOGS_FAILED');
  }
};

export const getAuditLogById = async (req: AuthRequest, res: Response) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('userId', 'name email');
    if (!log) {
      throw new AppError('Audit log not found', 404, 'RESOURCE_NOT_FOUND');
    }
    res.json(log);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Server error fetching audit log', 500, 'FETCH_AUDIT_LOG_FAILED');
  }
};
