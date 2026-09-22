"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const asyncHandler_1 = require("../middleware/asyncHandler");
const integrationController_1 = require("../controllers/integrationController");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.authorize)('ADMIN', 'GROUP_ESG_TEAM')); // Only Admins and Group ESG can manage integrations
router.get('/', (0, asyncHandler_1.asyncHandler)(integrationController_1.getIntegrations));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(integrationController_1.getIntegration));
router.post('/', (0, asyncHandler_1.asyncHandler)(integrationController_1.createIntegration));
router.put('/:id', (0, asyncHandler_1.asyncHandler)(integrationController_1.updateIntegration));
router.post('/:id/sync', (0, asyncHandler_1.asyncHandler)(integrationController_1.syncIntegration));
exports.default = router;
