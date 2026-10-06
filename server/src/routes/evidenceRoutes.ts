import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadEvidence, deleteEvidence, getEvidence, getCoverage, getGaps, verifyEvidence } from '../controllers/evidenceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

// Setup multer storage
const storage = multer.diskStorage({
  destination(req: any, file: any, cb: any) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename(req: any, file: any, cb: any) {
    // Sanitize filename to prevent directory traversal and remove dangerous chars
    const originalName = file?.originalname || 'unknown_file';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${sanitizedName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = /pdf|csv|xlsx|xls|doc|docx|jpg|jpeg|png/;
    const dangerousTypes = /exe|sh|bat|cmd|js|ts|php|py/;
    const originalName = file?.originalname || 'unknown_file.txt';
    const ext = path.extname(originalName).toLowerCase();
    
    if (dangerousTypes.test(ext)) {
      return cb(new Error('Executable files are strictly prohibited.'), false);
    }

    const extname = allowedTypes.test(ext);
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type! Allowed types: PDF, CSV, Excel, Word, Image.'));
    }
  }
});

router.route('/')
  .get(getEvidence)
  .post(authorize('PROJECT_OFFICER'), upload.single('file'), uploadEvidence);

router.get('/coverage', getCoverage);
router.get('/gaps', getGaps);

router.route('/:id')
  .delete(authorize('PROJECT_OFFICER'), deleteEvidence);

router.route('/:id/verify')
  .post(authorize('ADMIN', 'AUDITOR', 'GROUP_ESG_TEAM', 'BUSINESS_UNIT_REVIEWER'), verifyEvidence);

export default router;
