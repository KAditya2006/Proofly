import ESGRecord from '../models/ESGRecord';
import User from '../models/User';
import Notification from '../models/Notification';
import Project from '../models/Project';
import { logAudit } from '../utils/auditLogger';

export const checkSLAAndNotify = async () => {
  try {
    const SLA_HOURS = Number(process.env.SLA_HOURS || 48);
    const now = new Date();
    
    const overdueThreshold = new Date(now.getTime() - SLA_HOURS * 60 * 60 * 1000);
    const approachingThreshold = new Date(now.getTime() - (SLA_HOURS * 0.75) * 60 * 60 * 1000);

    // Find records that are either overdue or approaching SLA and haven't triggered an alert
    const targetRecords = await ESGRecord.find({
      status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] },
      submittedAt: { $lt: approachingThreshold },
      slaAlertSent: { $ne: true }
    }).populate('projectId');

    let processedCount = 0;

    for (const record of targetRecords) {
      if (!record.submittedAt) continue;
      
      const project: any = record.projectId;
      if (!project) continue;

      const isOverdue = record.submittedAt < overdueThreshold;
      const statusLabel = isOverdue ? 'OVERDUE' : 'APPROACHING_SLA';

      const reviewers = await User.find({
        role: 'BUSINESS_UNIT_REVIEWER',
        organizationId: project.businessUnitId,
        status: 'ACTIVE'
      });

      const groupEsg = await User.find({ role: 'GROUP_ESG_TEAM', status: 'ACTIVE' });
      const targetUsers = [...reviewers, ...groupEsg];

      const title = `SLA Alert: ${statusLabel}`;
      const message = `The ESG record (ID: ${record._id}) for project ${project.projectCode} is ${statusLabel} for the ${SLA_HOURS}h SLA window.`;
      
      for (const user of targetUsers) {
        await Notification.create({
          userId: user._id,
          title,
          message,
          type: isOverdue ? 'ERROR' : 'WARNING',
          read: false
        });
      }

      // Log the SLA alert to the existing AuditLog
      const sysUser = await User.findOne({ role: 'ADMIN' });
      await logAudit({
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
  } catch (error) {
    console.error('Error running checkSLAAndNotify:', error);
  }
};
