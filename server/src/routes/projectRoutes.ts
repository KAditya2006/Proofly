import express from 'express';
import { 
  getProjects, 
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect); // All project routes require authentication

router.route('/')
  .get(getProjects)
  .post(authorize('ADMIN'), createProject);

router.route('/:id')
  .get(getProjectById)
  .put(authorize('ADMIN'), updateProject)
  .delete(authorize('ADMIN'), deleteProject);

export default router;
