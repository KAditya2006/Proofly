"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobController_1 = require("../controllers/jobController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
// Operations and Admin can view/retry jobs
router.use((0, authMiddleware_1.authorize)('ADMIN', 'GROUP_ESG_TEAM', 'SUBSIDIARY_MANAGER'));
router.get('/', jobController_1.getJobs);
router.get('/:id', jobController_1.getJobById);
router.post('/:id/retry', jobController_1.retryJob);
exports.default = router;
