"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogById = exports.getAuditLogs = void 0;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const User_1 = __importDefault(require("../models/User"));
const errorHandler_1 = require("../middleware/errorHandler");
const hierarchy_1 = require("../utils/hierarchy");
const getAuditLogs = async (req, res) => {
    try {
        const { action, entityType, startDate, endDate, userId } = req.query;
        const query = {};
        if (action)
            query.action = action;
        if (entityType)
            query.entityType = entityType;
        if (userId)
            query.userId = userId;
        if (req.user?.role !== 'ADMIN') {
            const descendantOrgIds = await (0, hierarchy_1.getDescendantOrgIds)(req.user.organizationId);
            const authorizedUsers = await User_1.default.find({ organizationId: { $in: descendantOrgIds } }).select('_id');
            const authorizedUserIds = authorizedUsers.map(u => u._id.toString());
            if (query.userId) {
                if (!authorizedUserIds.includes(query.userId.toString())) {
                    return res.status(403).json({ message: 'Not authorized for this user' });
                }
            }
            else {
                query.userId = { $in: authorizedUserIds };
            }
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = new Date(startDate);
            if (endDate)
                query.createdAt.$lte = new Date(endDate);
        }
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const total = await AuditLog_1.default.countDocuments(query);
        const logs = await AuditLog_1.default.find(query)
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
    }
    catch (error) {
        throw new errorHandler_1.AppError('Server error fetching audit logs', 500, 'FETCH_AUDIT_LOGS_FAILED');
    }
};
exports.getAuditLogs = getAuditLogs;
const getAuditLogById = async (req, res) => {
    try {
        const log = await AuditLog_1.default.findById(req.params.id).populate('userId', 'name email');
        if (!log) {
            throw new errorHandler_1.AppError('Audit log not found', 404, 'RESOURCE_NOT_FOUND');
        }
        res.json(log);
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Server error fetching audit log', 500, 'FETCH_AUDIT_LOG_FAILED');
    }
};
exports.getAuditLogById = getAuditLogById;
