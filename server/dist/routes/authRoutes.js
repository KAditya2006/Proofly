"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per `window` (here, per 15 minutes)
    message: { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts, please try again after 15 minutes' } },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/login', authLimiter, authController_1.loginUser);
router.post('/change-password', authMiddleware_1.protect, authController_1.changePassword);
router.get('/me', authMiddleware_1.protect, authController_1.getMe);
exports.default = router;
