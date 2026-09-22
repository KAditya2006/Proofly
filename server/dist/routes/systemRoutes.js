"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const systemController_1 = require("../controllers/systemController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
// System checks restricted to ADMIN
router.use((0, authMiddleware_1.authorize)('ADMIN'));
router.get('/integrity', systemController_1.getIntegrityStatus);
router.get('/reconciliation', systemController_1.getReconciliationStatus);
router.get('/settings', systemController_1.getSystemSettings);
router.put('/settings', systemController_1.updateSystemSettings);
exports.default = router;
