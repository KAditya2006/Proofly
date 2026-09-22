"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assuranceController_1 = require("../controllers/assuranceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Only Auditors and Group ESG can manage assurance processes
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.authorize)('AUDITOR', 'GROUP_ESG_TEAM', 'ADMIN'));
router.get('/samples', assuranceController_1.getSamples);
router.post('/samples', assuranceController_1.createSample);
router.patch('/samples/:id', assuranceController_1.updateSampleStatus);
router.get('/findings', assuranceController_1.getFindings);
router.post('/findings', assuranceController_1.createFinding);
router.patch('/findings/:id/resolve', assuranceController_1.resolveFinding);
exports.default = router;
