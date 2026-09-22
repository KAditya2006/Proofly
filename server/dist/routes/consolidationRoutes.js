"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const consolidationController_1 = require("../controllers/consolidationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
// Basic route protection, deeper RBAC is inside the controllers
router.use((0, authMiddleware_1.authorize)('BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER', 'GROUP_ESG_TEAM', 'ADMIN', 'AUDITOR'));
router.get('/kpis', consolidationController_1.getConsolidationKPIs);
router.get('/lineage', consolidationController_1.getConsolidationLineage);
router.get('/readiness', consolidationController_1.getReadiness);
exports.default = router;
