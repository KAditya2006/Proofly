import { Request as ExpressReq, Response as ExpressRes } from 'express';
import { getConsolidatedKPIs, getLineage } from '../services/consolidationService';
import { calculateReadiness } from '../services/readinessService';
import Organization from '../models/Organization';
import Project from '../models/Project';
import { isAuthorizedScope, getAuthorizedProjectIds } from '../utils/hierarchy';

// @desc    Get consolidated KPIs for a specific scope and period
// @route   GET /api/consolidation/kpis
// @access  Private (Reviewers/Managers/Group ESG)
export const getConsolidationKPIs = async (req: any, res: ExpressRes) => {
  try {
    const { reportingPeriodId, scopeLevel, scopeId } = req.query;

    if (!reportingPeriodId || !scopeLevel) {
      return res.status(400).json({ message: 'reportingPeriodId and scopeLevel are required' });
    }

    // Role-based security check
    const { role, organizationId } = req.user;
    let allowedScopeId = scopeId;

    if (role === 'BUSINESS_UNIT_REVIEWER') {
      if (scopeLevel !== 'PROJECT' && scopeLevel !== 'BUSINESS_UNIT') {
        return res.status(403).json({ message: 'Unauthorized scope for BU Reviewer' });
      }
      if (scopeId && scopeId !== organizationId.toString()) {
        if (scopeLevel === 'PROJECT') {
            const project = await Project.findById(scopeId);
            if (!project || project.businessUnitId?.toString() !== organizationId.toString()) {
                return res.status(403).json({ message: 'Unauthorized access to this project' });
            }
        } else if (scopeLevel === 'BUSINESS_UNIT') {
            return res.status(403).json({ message: 'Unauthorized access to this BU' });
        }
      }
      allowedScopeId = scopeId || organizationId; // Default to their BU
    } else if (role === 'SUBSIDIARY_MANAGER') {
      if (scopeLevel === 'GROUP') {
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
    } else if (role === 'GROUP_ESG_TEAM') {
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
    } else if (role === 'PROJECT_OFFICER') {
      return res.status(403).json({ message: 'Project Officers cannot access consolidation views' });
    }

    const filters: any = {
      reportingPeriodId,
      scopeLevel,
      scopeId: allowedScopeId
    };

    const data = await getConsolidatedKPIs(filters);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating consolidation KPIs' });
  }
};

// @desc    Get data lineage for a specific indicator and scope
// @route   GET /api/consolidation/lineage
// @access  Private
export const getConsolidationLineage = async (req: any, res: ExpressRes) => {
  try {
    const { reportingPeriodId, scopeLevel, scopeId, indicatorId } = req.query;

    if (!reportingPeriodId || !scopeLevel || !indicatorId) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const { role, organizationId } = req.user;
    let allowedScopeId = scopeId;

    if (role === 'PROJECT_OFFICER') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Strict RBAC check for IDOR
    if (role === 'BUSINESS_UNIT_REVIEWER') {
      if (scopeLevel !== 'PROJECT' && scopeLevel !== 'BUSINESS_UNIT') {
        return res.status(403).json({ message: 'Unauthorized scope' });
      }
      if (scopeId && scopeId !== organizationId.toString()) {
        if (scopeLevel === 'PROJECT') {
            const project = await Project.findById(scopeId);
            if (!project || project.businessUnitId?.toString() !== organizationId.toString()) {
                return res.status(403).json({ message: 'Unauthorized access to this project' });
            }
        } else if (scopeLevel === 'BUSINESS_UNIT') {
            return res.status(403).json({ message: 'Unauthorized access to this BU' });
        }
      }
      allowedScopeId = scopeId || organizationId;
    } else if (role === 'SUBSIDIARY_MANAGER' || role === 'GROUP_ESG_TEAM') {
      if (role === 'SUBSIDIARY_MANAGER' && scopeLevel === 'GROUP') {
        return res.status(403).json({ message: 'Unauthorized scope' });
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

    const filters: any = {
      reportingPeriodId,
      scopeLevel,
      scopeId: allowedScopeId
    };

    const records = await getLineage(indicatorId as string, filters);
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating lineage' });
  }
};

// @desc    Get BRSR readiness breakdown
// @route   GET /api/consolidation/readiness
// @access  Private
export const getReadiness = async (req: any, res: ExpressRes) => {
  try {
    const { reportingPeriodId } = req.query;
    
    if (!reportingPeriodId) {
      return res.status(400).json({ message: 'reportingPeriodId is required' });
    }
    const { role, organizationId } = req.user;
    let authorizedProjectIds: any = undefined;

    if (role === 'BUSINESS_UNIT_REVIEWER' || role === 'SUBSIDIARY_MANAGER' || role === 'GROUP_ESG_TEAM') {
      authorizedProjectIds = await getAuthorizedProjectIds(organizationId);
    } else if (role === 'PROJECT_OFFICER') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const readiness = await calculateReadiness(reportingPeriodId as string, authorizedProjectIds);
    res.json(readiness);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error calculating readiness' });
  }
};
