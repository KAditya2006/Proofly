import { Response } from 'express';
import Task from '../models/Task';
import Notification from '../models/Notification';
import { logAudit } from '../utils/auditLogger';
import { AuthRequest } from '../middleware/authMiddleware';

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, assigneeId } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assigneeId) query.assigneeId = assigneeId;

    // RBAC enforced: only get tasks for user's organizations
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'AUDITOR') {
        query.organizationId = req.user?.organizationId;
    }

    const tasks = await Task.find(query)
      .populate('assigneeId', 'firstName lastName email')
      .populate('assignerId', 'firstName lastName email')
      .populate('projectId', 'name')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, assigneeId, organizationId, projectId, priority, dueDate, referenceType, referenceId } = req.body;

    const task = await Task.create({
      title,
      description,
      assigneeId,
      assignerId: req.user?._id,
      organizationId,
      projectId,
      priority,
      dueDate,
      referenceType,
      referenceId
    });

    await logAudit({
      userId: req.user?._id as any,
      action: 'CREATE',
      entityType: 'Task',
      entityId: task._id as any,
      after: { title, priority }
    });

    if (assigneeId) {
      await Notification.create({
        userId: assigneeId,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${title}`,
        type: 'INFO',
        link: `/tasks/${task._id}`
      });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status = status;
    await task.save();

    await logAudit({
      userId: req.user?._id as any,
      action: 'UPDATE',
      entityType: 'Task',
      entityId: task._id as any,
      after: { status }
    });

    if (task.assignerId.toString() !== req.user?._id.toString()) {
      await Notification.create({
        userId: task.assignerId,
        title: 'Task Status Updated',
        message: `Task "${task.title}" is now ${status}`,
        type: 'INFO',
        link: `/tasks/${task._id}`
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error });
  }
};
