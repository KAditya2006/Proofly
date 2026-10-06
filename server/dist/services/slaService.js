"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSLAAndNotify = void 0;
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const auditLogger_1 = require("../utils/auditLogger");
const checkSLAAndNotify = async () => {
    try {
        const SLA_HOURS = Number(process.env.SLA_HOURS || 48);
        const now = new Date();
        const overdueThreshold = new Date(now.getTime() - SLA_HOURS * 60 * 60 * 1000);
        const approachingThreshold = new Date(now.getTime() - (SLA_HOURS * 0.75) * 60 * 60 * 1000);
        // Find records that are either overdue or approaching SLA and haven't triggered an alert
        const targetRecords = await ESGRecord_1.default.find({
            status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] },
            submittedAt: { $lt: approachingThreshold },
            slaAlertSent: { $ne: true }
        }).populate('projectId');
        let processedCount = 0;
        for (const record of targetRecords) {
            if (!record.submittedAt)
                continue;
            const project = record.projectId;
            if (!project)
                continue;
            const isOverdue = record.submittedAt < overdueThreshold;
            const statusLabel = isOverdue ? 'OVERDUE' : 'APPROACHING_SLA';
            const reviewers = await User_1.default.find({
                role: 'BUSINESS_UNIT_REVIEWER',
                organizationId: project.businessUnitId,
                status: 'ACTIVE'
            });
            const groupEsg = await User_1.default.find({ role: 'GROUP_ESG_TEAM', status: 'ACTIVE' });
            const targetUsers = [...reviewers, ...groupEsg];
            const title = `SLA Alert: ${statusLabel}`;
            const message = `The ESG record (ID: ${record._id}) for project ${project.projectCode} is ${statusLabel} for the ${SLA_HOURS}h SLA window.`;
            for (const user of targetUsers) {
                await Notification_1.default.create({
                    userId: user._id,
                    title,
                    message,
                    type: isOverdue ? 'ERROR' : 'WARNING',
                    read: false
                });
            }
            // Log the SLA alert to the existing AuditLog
            const sysUser = await User_1.default.findOne({ role: 'ADMIN' });
            await (0, auditLogger_1.logAudit)({
                userId: sysUser?._id.toString() || '000000000000000000000000',
                action: 'SLA_ALERT_SENT',
                entityType: 'ESGRecord',
                entityId: record._id.toString(),
                before: { statusLabel: 'NONE' },
                after: { statusLabel, notifiedCount: targetUsers.length }
            });
            // Mark the record to prevent duplicate SLA alerts
            record.slaAlertSent = true;
            await record.save();
            processedCount++;
        }
        if (processedCount > 0) {
            console.log(`[SLA Job] Triggered notifications for ${processedCount} records.`);
        }
    }
    catch (error) {
        console.error('Error running checkSLAAndNotify:', error);
    }
};
exports.checkSLAAndNotify = checkSLAAndNotify;
