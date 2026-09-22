import express from 'express';
import { getBRSRCoreDashboard } from '../controllers/brsrCoreController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('GROUP_ESG_TEAM', 'ADMIN', 'AUDITOR', 'BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER'));

router.get('/dashboard', getBRSRCoreDashboard);

export default router;
