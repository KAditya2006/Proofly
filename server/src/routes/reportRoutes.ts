import express from 'express';
import { 
  generateReport, 
  getReports, 
  getReportById,
  qualityCheckReport,
  submitReportReview,
  finalizeReport,
  archiveReport,
  getReportVersions,
  compareReports,
  getReportLineage,
  getEvidencePack,
  exportReport
} from '../controllers/reportController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
// Read-only routes (including AUDITOR)
const readAccess = authorize('BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER', 'GROUP_ESG_TEAM', 'ADMIN', 'AUDITOR');
router.get('/', readAccess, getReports);
router.get('/:id', readAccess, getReportById);
router.get('/:id/versions', readAccess, getReportVersions);
router.get('/:id/compare', readAccess, compareReports);
router.get('/:id/lineage', readAccess, getReportLineage);
router.get('/:id/evidence-pack', readAccess, getEvidencePack);
router.get('/:id/export', readAccess, exportReport);

// Write/Mutate routes (excluding AUDITOR)
const writeAccess = authorize('BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER', 'GROUP_ESG_TEAM', 'ADMIN');
router.post('/generate', writeAccess, generateReport);
router.post('/:id/quality-check', writeAccess, qualityCheckReport);
router.post('/:id/submit-review', writeAccess, submitReportReview);
router.post('/:id/finalize', writeAccess, finalizeReport);
router.post('/:id/archive', writeAccess, archiveReport);

export default router;
