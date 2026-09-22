import { Router } from 'express';
import { getSamples, createSample, updateSampleStatus, getFindings, createFinding, resolveFinding } from '../controllers/assuranceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Only Auditors and Group ESG can manage assurance processes
router.use(protect);
router.use(authorize('AUDITOR', 'GROUP_ESG_TEAM', 'ADMIN'));

router.get('/samples', getSamples);
router.post('/samples', createSample);
router.patch('/samples/:id', updateSampleStatus);

router.get('/findings', getFindings);
router.post('/findings', createFinding);
router.patch('/findings/:id/resolve', resolveFinding);

export default router;
