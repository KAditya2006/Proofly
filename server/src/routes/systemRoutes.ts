import express from 'express';
import { getIntegrityStatus, getReconciliationStatus, getSystemSettings, updateSystemSettings } from '../controllers/systemController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
// System checks restricted to ADMIN
router.use(authorize('ADMIN'));

router.get('/integrity', getIntegrityStatus);
router.get('/reconciliation', getReconciliationStatus);
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

export default router;
