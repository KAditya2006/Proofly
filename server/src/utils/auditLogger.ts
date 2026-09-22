import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';

interface AuditParams {
  userId: string | mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId: string | mongoose.Types.ObjectId;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string;
}

/**
 * Creates an audit log entry.
 * @param params AuditParams
 */
export const logAudit = async (params: AuditParams) => {
  try {
    const auditEntry = new AuditLog({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before,
      after: params.after,
      ipAddress: params.ipAddress
    });
    
    await auditEntry.save();
  } catch (error) {
    // We log the error but we generally don't want audit logging failure to crash the main transaction
    // unless strict audit compliance is enforced at the DB transaction level.
    console.error('Failed to write audit log:', error);
  }
};
