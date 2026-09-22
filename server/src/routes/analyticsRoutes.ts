import express from 'express';
import { 
  getOverview, 
  getTrends, 
  getContributors, 
  getDataQuality,
  getAnomalies 
} from '../controllers/analyticsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/overview', getOverview);
router.get('/trends', getTrends);
router.get('/contributors', getContributors);
router.get('/data-quality', getDataQuality);
router.get('/anomalies', getAnomalies);

export default router;
