import express from 'express';
import { getJobs, getJobById, retryJob } from '../controllers/jobController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
// Operations and Admin can view/retry jobs
router.use(authorize('ADMIN', 'GROUP_ESG_TEAM', 'SUBSIDIARY_MANAGER'));

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/:id/retry', retryJob);

export default router;
