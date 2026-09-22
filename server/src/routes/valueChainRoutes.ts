import express from 'express';
import { getValueChainDashboard } from '../controllers/valueChainController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER', 'GROUP_ESG_TEAM', 'ADMIN', 'AUDITOR'));

router.get('/dashboard', getValueChainDashboard);

export default router;
