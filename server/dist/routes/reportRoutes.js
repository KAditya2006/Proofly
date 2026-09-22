"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportController_1 = require("../controllers/reportController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
// Read-only routes (including AUDITOR)
const readAccess = (0, authMiddleware_1.authorize)('BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER', 'GROUP_ESG_TEAM', 'ADMIN', 'AUDITOR');
router.get('/', readAccess, reportController_1.getReports);
router.get('/:id', readAccess, reportController_1.getReportById);
router.get('/:id/versions', readAccess, reportController_1.getReportVersions);
router.get('/:id/compare', readAccess, reportController_1.compareReports);
router.get('/:id/lineage', readAccess, reportController_1.getReportLineage);
router.get('/:id/evidence-pack', readAccess, reportController_1.getEvidencePack);
router.get('/:id/export', readAccess, reportController_1.exportReport);
// Write/Mutate routes (excluding AUDITOR)
const writeAccess = (0, authMiddleware_1.authorize)('BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER', 'GROUP_ESG_TEAM', 'ADMIN');
router.post('/generate', writeAccess, reportController_1.generateReport);
router.post('/:id/quality-check', writeAccess, reportController_1.qualityCheckReport);
router.post('/:id/submit-review', writeAccess, reportController_1.submitReportReview);
router.post('/:id/finalize', writeAccess, reportController_1.finalizeReport);
router.post('/:id/archive', writeAccess, reportController_1.archiveReport);
exports.default = router;
