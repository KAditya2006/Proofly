"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const evidenceController_1 = require("../controllers/evidenceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
// Setup multer storage
const storage = multer_1.default.diskStorage({
    destination(req, file, cb) {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        // Sanitize filename to prevent directory traversal and remove dangerous chars
        const originalName = file?.originalname || 'unknown_file';
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${Date.now()}-${sanitizedName}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|csv|xlsx|xls|doc|docx|jpg|jpeg|png/;
        const dangerousTypes = /exe|sh|bat|cmd|js|ts|php|py/;
        const originalName = file?.originalname || 'unknown_file.txt';
        const ext = path_1.default.extname(originalName).toLowerCase();
        if (dangerousTypes.test(ext)) {
            return cb(new Error('Executable files are strictly prohibited.'), false);
        }
        const extname = allowedTypes.test(ext);
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        else {
            cb(new Error('Invalid file type! Allowed types: PDF, CSV, Excel, Word, Image.'));
        }
    }
});
router.route('/')
    .get(evidenceController_1.getEvidence)
    .post((0, authMiddleware_1.authorize)('PROJECT_OFFICER'), upload.single('file'), evidenceController_1.uploadEvidence);
router.get('/coverage', evidenceController_1.getCoverage);
router.get('/gaps', evidenceController_1.getGaps);
router.route('/:id')
    .delete((0, authMiddleware_1.authorize)('PROJECT_OFFICER'), evidenceController_1.deleteEvidence);
router.route('/:id/verify')
    .post((0, authMiddleware_1.authorize)('ADMIN', 'AUDITOR', 'GROUP_ESG_TEAM', 'BUSINESS_UNIT_REVIEWER'), evidenceController_1.verifyEvidence);
exports.default = router;
