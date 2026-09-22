"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const indicatorController_1 = require("../controllers/indicatorController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.route('/')
    .get(indicatorController_1.getIndicators)
    .post((0, authMiddleware_1.authorize)('ADMIN'), indicatorController_1.createIndicator);
router.route('/:id')
    .get(indicatorController_1.getIndicatorById)
    .put((0, authMiddleware_1.authorize)('ADMIN'), indicatorController_1.updateIndicator);
exports.default = router;
