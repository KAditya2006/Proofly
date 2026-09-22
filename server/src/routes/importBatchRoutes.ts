import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  getImportBatches,
  getImportBatch
} from '../controllers/importBatchController';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'GROUP_ESG_TEAM'));

router.get('/', getImportBatches);
router.get('/:id', getImportBatch);

export default router;
