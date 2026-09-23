"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReadiness = exports.getConsolidationLineage = exports.getConsolidationKPIs = void 0;
const consolidationService_1 = require("../services/consolidationService");
const readinessService_1 = require("../services/readinessService");
const Project_1 = __importDefault(require("../models/Project"));
const hierarchy_1 = require("../utils/hierarchy");
// @desc    Get consolidated KPIs for a specific scope and period
// @route   GET /api/consolidation/kpis
// @access  Private (Reviewers/Managers/Group ESG)
const getConsolidationKPIs = async (req, res) => {
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
                    const project = await Project_1.default.findById(scopeId);
                    if (!project || project.businessUnitId?.toString() !== organizationId.toString()) {
                        return res.status(403).json({ message: 'Unauthorized access to this project' });
                    }
                }
                else if (scopeLevel === 'BUSINESS_UNIT') {
                    return res.status(403).json({ message: 'Unauthorized access to this BU' });
                }
            }
            allowedScopeId = scopeId || organizationId; // Default to their BU
        }
        else if (role === 'SUBSIDIARY_MANAGER') {
            if (scopeLevel === 'GROUP') {
                return res.status(403).json({ message: 'Unauthorized scope for Sub Manager' });
            }
            if (scopeId && scopeId !== organizationId.toString()) {
                const isAuth = await (0, hierarchy_1.isAuthorizedScope)(organizationId, scopeId);
                if (!isAuth) {
                    if (scopeLevel === 'PROJECT') {
                        const project = await Project_1.default.findById(scopeId);
                        if (!project || !(await (0, hierarchy_1.isAuthorizedScope)(organizationId, project.organizationId))) {
                            return res.status(403).json({ message: 'Unauthorized access to this project' });
                        }
                    }
                    else {
                        return res.status(403).json({ message: 'Unauthorized access to this scope' });
                    }
                }
            }
            allowedScopeId = scopeId || organizationId;
        }
        else if (role === 'GROUP_ESG_TEAM') {
            if (scopeId && scopeId !== organizationId.toString()) {
                const isAuth = await (0, hierarchy_1.isAuthorizedScope)(organizationId, scopeId);
                if (!isAuth) {
                    if (scopeLevel === 'PROJECT') {
                        const project = await Project_1.default.findById(scopeId);
                        if (!project || !(await (0, hierarchy_1.isAuthorizedScope)(organizationId, project.organizationId))) {
                            return res.status(403).json({ message: 'Unauthorized access to this project' });
                        }
                    }
                    else {
                        return res.status(403).json({ message: 'Unauthorized access to this scope' });
                    }
                }
            }
            allowedScopeId = scopeId || organizationId;
        }
        else if (role === 'PROJECT_OFFICER') {
            return res.status(403).json({ message: 'Project Officers cannot access consolidation views' });
        }
        const filters = {
            reportingPeriodId,
            scopeLevel,
            scopeId: allowedScopeId
        };
        const data = await (0, consolidationService_1.getConsolidatedKPIs)(filters);
        res.json(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error generating consolidation KPIs' });
    }
};
exports.getConsolidationKPIs = getConsolidationKPIs;
// @desc    Get data lineage for a specific indicator and scope
// @route   GET /api/consolidation/lineage
// @access  Private
const getConsolidationLineage = async (req, res) => {
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
                    const project = await Project_1.default.findById(scopeId);
                    if (!project || project.businessUnitId?.toString() !== organizationId.toString()) {
                        return res.status(403).json({ message: 'Unauthorized access to this project' });
                    }
                }
                else if (scopeLevel === 'BUSINESS_UNIT') {
                    return res.status(403).json({ message: 'Unauthorized access to this BU' });
                }
            }
            allowedScopeId = scopeId || organizationId;
        }
        else if (role === 'SUBSIDIARY_MANAGER' || role === 'GROUP_ESG_TEAM') {
            if (role === 'SUBSIDIARY_MANAGER' && scopeLevel === 'GROUP') {
                return res.status(403).json({ message: 'Unauthorized scope' });
            }
            if (scopeId && scopeId !== organizationId.toString()) {
                const isAuth = await (0, hierarchy_1.isAuthorizedScope)(organizationId, scopeId);
                if (!isAuth) {
                    if (scopeLevel === 'PROJECT') {
                        const project = await Project_1.default.findById(scopeId);
                        if (!project || !(await (0, hierarchy_1.isAuthorizedScope)(organizationId, project.organizationId))) {
                            return res.status(403).json({ message: 'Unauthorized access to this project' });
                        }
                    }
                    else {
                        return res.status(403).json({ message: 'Unauthorized access to this scope' });
                    }
                }
            }
            allowedScopeId = scopeId || organizationId;
        }
        const filters = {
            reportingPeriodId,
            scopeLevel,
            scopeId: allowedScopeId
        };
        const records = await (0, consolidationService_1.getLineage)(indicatorId, filters);
        res.json(records);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error generating lineage' });
    }
};
exports.getConsolidationLineage = getConsolidationLineage;
// @desc    Get BRSR readiness breakdown
// @route   GET /api/consolidation/readiness
// @access  Private
const getReadiness = async (req, res) => {
    try {
        const { reportingPeriodId } = req.query;
        if (!reportingPeriodId) {
            return res.status(400).json({ message: 'reportingPeriodId is required' });
        }
        const { role, organizationId } = req.user;
        let authorizedProjectIds = undefined;
        if (role === 'BUSINESS_UNIT_REVIEWER' || role === 'SUBSIDIARY_MANAGER' || role === 'GROUP_ESG_TEAM') {
            authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(organizationId);
        }
        else if (role === 'PROJECT_OFFICER') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const readiness = await (0, readinessService_1.calculateReadiness)(reportingPeriodId, authorizedProjectIds);
        res.json(readiness);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error calculating readiness' });
    }
};
exports.getReadiness = getReadiness;
