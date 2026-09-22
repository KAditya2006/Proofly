"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSystemSettings = exports.getSystemSettings = exports.getReconciliationStatus = exports.getIntegrityStatus = void 0;
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const Project_1 = __importDefault(require("../models/Project"));
const Organization_1 = __importDefault(require("../models/Organization"));
const SystemSetting_1 = __importDefault(require("../models/SystemSetting"));
const errorHandler_1 = require("../middleware/errorHandler");
const getIntegrityStatus = async (req, res) => {
    try {
        // Basic checks
        const totalRecords = await ESGRecord_1.default.countDocuments();
        // Check for orphan records (no valid project)
        const allProjects = await Project_1.default.find().select('_id');
        const projectIds = allProjects.map(p => p._id);
        const orphanRecords = await ESGRecord_1.default.countDocuments({
            projectId: { $nin: projectIds }
        });
        // Check for missing hierarchies in organizations
        const allOrgs = await Organization_1.default.find();
        let brokenHierarchies = 0;
        allOrgs.forEach(org => {
            if (org.type !== 'GROUP' && org.parentId) {
                const parentExists = allOrgs.some(o => o._id.toString() === org.parentId?.toString());
                if (!parentExists)
                    brokenHierarchies++;
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
    }
    catch (error) {
        throw new errorHandler_1.AppError('Server error running integrity checks', 500, 'INTEGRITY_CHECK_FAILED');
    }
};
exports.getIntegrityStatus = getIntegrityStatus;
const getReconciliationStatus = async (req, res) => {
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
    }
    catch (error) {
        throw new errorHandler_1.AppError('Server error running reconciliation checks', 500, 'RECONCILIATION_CHECK_FAILED');
    }
};
exports.getReconciliationStatus = getReconciliationStatus;
const getSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSetting_1.default.findOne();
        if (!settings) {
            settings = await SystemSetting_1.default.create({});
        }
        res.json(settings);
    }
    catch (error) {
        throw new errorHandler_1.AppError('Server error fetching system settings', 500, 'SETTINGS_FETCH_FAILED');
    }
};
exports.getSystemSettings = getSystemSettings;
const updateSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSetting_1.default.findOne();
        if (!settings) {
            settings = new SystemSetting_1.default(req.body);
        }
        else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        res.json(settings);
    }
    catch (error) {
        throw new errorHandler_1.AppError('Server error updating system settings', 500, 'SETTINGS_UPDATE_FAILED');
    }
};
exports.updateSystemSettings = updateSystemSettings;
