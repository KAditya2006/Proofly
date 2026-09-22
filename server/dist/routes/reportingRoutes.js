"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportingPeriodController_1 = require("../controllers/reportingPeriodController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect); // All routes require authentication
router.route('/')
    .get(reportingPeriodController_1.getReportingPeriods)
    .post((0, authMiddleware_1.authorize)('ADMIN'), reportingPeriodController_1.createReportingPeriod);
router.route('/active').get(reportingPeriodController_1.getActiveReportingPeriods);
router.route('/:id')
    .put((0, authMiddleware_1.authorize)('ADMIN'), reportingPeriodController_1.updateReportingPeriod);
router.route('/:id/close')
    .post((0, authMiddleware_1.authorize)('ADMIN', 'GROUP_ESG_TEAM'), reportingPeriodController_1.closeReportingPeriod);
exports.default = router;
