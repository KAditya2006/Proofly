import express from 'express';
import { 
  getPendingReviews,
  approveSubmission,
  requestCorrection,
  rejectSubmission,
  escalateSubmission
} from '../controllers/reviewController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

// Allow only Reviewers, Managers, and Admins to access these routes
router.use(authorize('BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER', 'GROUP_ESG_TEAM', 'ADMIN'));

router.route('/').get(getPendingReviews);
router.post('/:id/approve', approveSubmission);
router.post('/:id/correction', requestCorrection);
router.post('/:id/reject', rejectSubmission);
router.post('/:id/escalate', escalateSubmission);

export default router;
