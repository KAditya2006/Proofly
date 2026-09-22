"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const bulkUploadController_1 = require("../controllers/bulkUploadController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/temp/' });
router.post('/preview', (0, authMiddleware_1.authorize)('ADMIN', 'GROUP_ESG_TEAM', 'PROJECT_OFFICER'), upload.single('file'), bulkUploadController_1.previewBulkUpload);
router.post('/confirm', (0, authMiddleware_1.authorize)('ADMIN', 'GROUP_ESG_TEAM', 'PROJECT_OFFICER'), bulkUploadController_1.confirmBulkUpload);
exports.default = router;
