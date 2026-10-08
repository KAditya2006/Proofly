"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskController_1 = require("../controllers/taskController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.get('/', (0, authMiddleware_1.authorize)('ADMIN', 'GROUP_ESG_TEAM', 'SUBSIDIARY_MANAGER', 'BUSINESS_UNIT_REVIEWER', 'PROJECT_OFFICER', 'AUDITOR'), taskController_1.getTasks);
router.post('/', (0, authMiddleware_1.authorize)('ADMIN', 'GROUP_ESG_TEAM', 'SUBSIDIARY_MANAGER', 'BUSINESS_UNIT_REVIEWER'), taskController_1.createTask);
router.patch('/:id/status', (0, authMiddleware_1.authorize)('ADMIN', 'GROUP_ESG_TEAM', 'SUBSIDIARY_MANAGER', 'BUSINESS_UNIT_REVIEWER', 'PROJECT_OFFICER'), taskController_1.updateTaskStatus);
exports.default = router;
