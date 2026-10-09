import express from 'express';
import { 
  getOrganizations, 
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getMyNetwork
} from '../controllers/organizationController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect); // All org routes require authentication

router.route('/')
  .get(getOrganizations)
  .post(authorize('ADMIN'), createOrganization);

router.route('/my-network').get(getMyNetwork);

router.route('/:id')
  .get(getOrganizationById)
  .put(authorize('ADMIN'), updateOrganization)
  .delete(authorize('ADMIN'), deleteOrganization);

export default router;
