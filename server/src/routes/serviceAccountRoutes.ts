import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  getServiceAccounts,
  createServiceAccount,
  revokeServiceAccount
} from '../controllers/serviceAccountController';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/', getServiceAccounts);
router.post('/', createServiceAccount);
router.put('/:id/revoke', revokeServiceAccount);

export default router;
