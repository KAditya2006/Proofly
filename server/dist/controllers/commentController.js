"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComment = exports.getComments = void 0;
const Comment_1 = __importDefault(require("../models/Comment"));
const auditLogger_1 = require("../utils/auditLogger");
const getComments = async (req, res) => {
    try {
        const { referenceId, referenceType } = req.query;
        if (!referenceId || !referenceType) {
            return res.status(400).json({ message: 'referenceId and referenceType are required' });
        }
        const comments = await Comment_1.default.find({
            referenceId: referenceId,
            referenceType: referenceType
        })
            .populate('userId', 'firstName lastName email role')
            .sort({ createdAt: 1 });
        res.json(comments);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error });
    }
};
exports.getComments = getComments;
const createComment = async (req, res) => {
    try {
        const { referenceId, referenceType, commentText } = req.body;
        const comment = await Comment_1.default.create({
            referenceId,
            referenceType,
            userId: req.user?._id,
            commentText
        });
        await (0, auditLogger_1.logAudit)({
            userId: req.user?._id,
            action: 'CREATE',
            entityType: 'Comment',
            entityId: comment._id,
            after: { referenceType, referenceId }
        });
        res.status(201).json(comment);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating comment', error });
    }
};
exports.createComment = createComment;
