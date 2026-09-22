import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  getIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  syncIntegration
} from '../controllers/integrationController';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'GROUP_ESG_TEAM')); // Only Admins and Group ESG can manage integrations

router.get('/', asyncHandler(getIntegrations));
router.get('/:id', asyncHandler(getIntegration));
router.post('/', asyncHandler(createIntegration));
router.put('/:id', asyncHandler(updateIntegration));
router.post('/:id/sync', asyncHandler(syncIntegration));

export default router;
