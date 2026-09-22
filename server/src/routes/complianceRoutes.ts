import { Router } from 'express';
import { getDisclosures, getActiveConfiguration, getComplianceControls } from '../controllers/complianceController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/disclosures', getDisclosures);
router.get('/configuration/active', getActiveConfiguration);
router.get('/controls', getComplianceControls);

export default router;
