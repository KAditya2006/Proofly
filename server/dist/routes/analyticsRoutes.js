"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.get('/overview', analyticsController_1.getOverview);
router.get('/trends', analyticsController_1.getTrends);
router.get('/contributors', analyticsController_1.getContributors);
router.get('/data-quality', analyticsController_1.getDataQuality);
router.get('/anomalies', analyticsController_1.getAnomalies);
exports.default = router;
