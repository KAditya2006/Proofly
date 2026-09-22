import express from 'express';
import { getAuditLogs, getAuditLogById } from '../controllers/auditController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
// Operations, Admin, and Auditor can view audit logs
router.use(authorize('ADMIN', 'GROUP_ESG_TEAM', 'AUDITOR'));

router.get('/', getAuditLogs);
router.get('/:id', getAuditLogById);

export default router;
