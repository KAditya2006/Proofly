import express from 'express';
import { getComments, createComment } from '../controllers/commentController';

const router = express.Router();

router.get('/', getComments);
router.post('/', createComment);

export default router;
