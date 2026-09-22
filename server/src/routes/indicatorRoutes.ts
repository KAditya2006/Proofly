import express from 'express';
import { 
  getIndicators, 
  getIndicatorById,
  createIndicator,
  updateIndicator
} from '../controllers/indicatorController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getIndicators)
  .post(authorize('ADMIN'), createIndicator);

router.route('/:id')
  .get(getIndicatorById)
  .put(authorize('ADMIN'), updateIndicator);

export default router;
