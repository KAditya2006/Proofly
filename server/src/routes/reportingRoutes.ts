import express from 'express';
import { 
  getReportingPeriods, 
  getActiveReportingPeriods,
  createReportingPeriod,
  updateReportingPeriod,
  closeReportingPeriod
} from '../controllers/reportingPeriodController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
  .get(getReportingPeriods)
  .post(createReportingPeriod);

router.route('/active').get(getActiveReportingPeriods);

router.route('/:id')
  .put(authorize('ADMIN'), updateReportingPeriod);

router.route('/:id/close')
  .post(authorize('ADMIN', 'GROUP_ESG_TEAM'), closeReportingPeriod);

export default router;
