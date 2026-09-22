"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
/**
 * Creates an audit log entry.
 * @param params AuditParams
 */
const logAudit = async (params) => {
    try {
        const auditEntry = new AuditLog_1.default({
            userId: params.userId,
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            before: params.before,
            after: params.after,
            ipAddress: params.ipAddress
        });
        await auditEntry.save();
    }
    catch (error) {
        // We log the error but we generally don't want audit logging failure to crash the main transaction
        // unless strict audit compliance is enforced at the DB transaction level.
        console.error('Failed to write audit log:', error);
    }
};
exports.logAudit = logAudit;
