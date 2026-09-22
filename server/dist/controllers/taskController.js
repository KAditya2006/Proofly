"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskStatus = exports.createTask = exports.getTasks = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const Notification_1 = __importDefault(require("../models/Notification"));
const auditLogger_1 = require("../utils/auditLogger");
const getTasks = async (req, res) => {
    try {
        const { status, priority, assigneeId } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (priority)
            query.priority = priority;
        if (assigneeId)
            query.assigneeId = assigneeId;
        // RBAC enforced: only get tasks for user's organizations
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'AUDITOR') {
            query.organizationId = req.user?.organizationId;
        }
        const tasks = await Task_1.default.find(query)
            .populate('assigneeId', 'firstName lastName email')
            .populate('assignerId', 'firstName lastName email')
            .populate('projectId', 'name')
            .sort({ dueDate: 1, createdAt: -1 });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error });
    }
};
exports.getTasks = getTasks;
const createTask = async (req, res) => {
    try {
        const { title, description, assigneeId, organizationId, projectId, priority, dueDate, referenceType, referenceId } = req.body;
        const task = await Task_1.default.create({
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
        await (0, auditLogger_1.logAudit)({
            userId: req.user?._id,
            action: 'CREATE',
            entityType: 'Task',
            entityId: task._id,
            after: { title, priority }
        });
        if (assigneeId) {
            await Notification_1.default.create({
                userId: assigneeId,
                title: 'New Task Assigned',
                message: `You have been assigned a new task: ${title}`,
                type: 'INFO',
                link: `/tasks/${task._id}`
            });
        }
        res.status(201).json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating task', error });
    }
};
exports.createTask = createTask;
const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task_1.default.findById(req.params.id);
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        task.status = status;
        await task.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user?._id,
            action: 'UPDATE',
            entityType: 'Task',
            entityId: task._id,
            after: { status }
        });
        if (task.assignerId.toString() !== req.user?._id.toString()) {
            await Notification_1.default.create({
                userId: task.assignerId,
                title: 'Task Status Updated',
                message: `Task "${task.title}" is now ${status}`,
                type: 'INFO',
                link: `/tasks/${task._id}`
            });
        }
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating task', error });
    }
};
exports.updateTaskStatus = updateTaskStatus;
