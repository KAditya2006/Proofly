"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviewController_1 = require("../controllers/reviewController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
// Allow only Reviewers, Managers, and Admins to access these routes
router.use((0, authMiddleware_1.authorize)('BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER', 'GROUP_ESG_TEAM', 'ADMIN'));
router.route('/').get(reviewController_1.getPendingReviews);
router.post('/:id/approve', reviewController_1.approveSubmission);
router.post('/:id/correction', reviewController_1.requestCorrection);
router.post('/:id/reject', reviewController_1.rejectSubmission);
exports.default = router;
