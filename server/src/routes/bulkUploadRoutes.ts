import express from 'express';
import multer from 'multer';
import { previewBulkUpload, confirmBulkUpload } from '../controllers/bulkUploadController';
import { authorize } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

router.post('/preview', authorize('ADMIN', 'GROUP_ESG_TEAM', 'PROJECT_OFFICER'), upload.single('file'), previewBulkUpload);
router.post('/confirm', authorize('ADMIN', 'GROUP_ESG_TEAM', 'PROJECT_OFFICER'), confirmBulkUpload);

export default router;
