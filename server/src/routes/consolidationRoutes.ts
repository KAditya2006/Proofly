import express from 'express';
import { 
  getConsolidationKPIs,
  getConsolidationLineage,
  getReadiness
} from '../controllers/consolidationController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

// Basic route protection, deeper RBAC is inside the controllers
router.use(authorize('BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER', 'GROUP_ESG_TEAM', 'ADMIN', 'AUDITOR'));

router.get('/kpis', getConsolidationKPIs);
router.get('/lineage', getConsolidationLineage);
router.get('/readiness', getReadiness);

export default router;
