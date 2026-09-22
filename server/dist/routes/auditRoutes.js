"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auditController_1 = require("../controllers/auditController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
// Operations, Admin, and Auditor can view audit logs
router.use((0, authMiddleware_1.authorize)('ADMIN', 'GROUP_ESG_TEAM', 'AUDITOR'));
router.get('/', auditController_1.getAuditLogs);
router.get('/:id', auditController_1.getAuditLogById);
exports.default = router;
