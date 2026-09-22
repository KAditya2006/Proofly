import { Response } from 'express';
import ValueChainPartner from '../models/ValueChainPartner';
import ESGRecord from '../models/ESGRecord';
import ESGIndicator from '../models/ESGIndicator';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get Value Chain Dashboard Stats
// @route   GET /api/value-chain/dashboard
// @access  Private
export const getValueChainDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reportingPeriodId } = req.query;
    if (!reportingPeriodId) {
      res.status(400).json({ message: 'Reporting period is required' });
      return;
    }

    // Enforce RBAC Scope
    const { role, organizationId } = req.user!;
    let query: Record<string, unknown> = { reportingPeriodId: new mongoose.Types.ObjectId(reportingPeriodId as string) };

    if (role === 'BUSINESS_UNIT_REVIEWER' || role === 'SUBSIDIARY_MANAGER') {
      query.organizationId = organizationId;
    } else if (role === 'PROJECT_OFFICER') {
      res.status(403).json({ message: 'Unauthorized for Value Chain management' });
      return;
    }

    const partners = await ValueChainPartner.find(query);

    const total = partners.length;
    const requested = partners.filter(p => p.status === 'DATA_REQUESTED').length;
    const submitted = partners.filter(p => p.status === 'DATA_SUBMITTED').length;
    const approved = partners.filter(p => p.status === 'APPROVED').length;
    
    // Coverage = (Approved / Total) * 100
    const coverage = total > 0 ? Math.round((approved / total) * 100) : 0;

    res.json({
      metrics: {
        total,
        requested,
        submitted,
        approved,
        pending: total - approved,
        coverage
      },
      partners // We can send all partners for the list view in MVP
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading Value Chain data' });
  }
};
