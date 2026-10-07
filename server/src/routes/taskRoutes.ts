import express from 'express';
import { getTasks, createTask, updateTaskStatus } from '../controllers/taskController';
import { authorize, protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'GROUP_ESG_TEAM', 'SUBSIDIARY_MANAGER', 'BUSINESS_UNIT_REVIEWER', 'PROJECT_OFFICER', 'AUDITOR'), getTasks);
router.post('/', authorize('ADMIN', 'GROUP_ESG_TEAM', 'SUBSIDIARY_MANAGER', 'BUSINESS_UNIT_REVIEWER'), createTask);
router.patch('/:id/status', authorize('ADMIN', 'GROUP_ESG_TEAM', 'SUBSIDIARY_MANAGER', 'BUSINESS_UNIT_REVIEWER', 'PROJECT_OFFICER'), updateTaskStatus);

export default router;
