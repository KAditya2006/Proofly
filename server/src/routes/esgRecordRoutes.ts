import express from 'express';
import { 
  getRecords, 
  getRecordById, 
  createRecord, 
  updateRecord, 
  validateRecordEndpoint, 
  submitRecord 
} from '../controllers/esgRecordController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getRecords)
  .post(authorize('PROJECT_OFFICER'), createRecord);

router.route('/:id')
  .get(getRecordById)
  .put(authorize('PROJECT_OFFICER'), updateRecord);

router.post('/:id/validate', authorize('PROJECT_OFFICER'), validateRecordEndpoint);
router.post('/:id/submit', authorize('PROJECT_OFFICER'), submitRecord);

export default router;
