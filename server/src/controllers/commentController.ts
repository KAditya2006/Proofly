import { Response } from 'express';
import Comment from '../models/Comment';
import { logAudit } from '../utils/auditLogger';
import { AuthRequest } from '../middleware/authMiddleware';

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { referenceId, referenceType } = req.query;
    if (!referenceId || !referenceType) {
      return res.status(400).json({ message: 'referenceId and referenceType are required' });
    }

    const comments = await Comment.find({ 
      referenceId: referenceId as any, 
      referenceType: referenceType as any 
    })
      .populate('userId', 'firstName lastName email role')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { referenceId, referenceType, commentText } = req.body;

    const comment = await Comment.create({
      referenceId,
      referenceType,
      userId: req.user?._id,
      commentText
    });

    await logAudit({
      userId: req.user?._id as any,
      action: 'CREATE',
      entityType: 'Comment',
      entityId: comment._id as any,
      after: { referenceType, referenceId }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating comment', error });
  }
};
