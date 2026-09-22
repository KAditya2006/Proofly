"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getMyNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification_1.default.find({ userId: req.user?._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
};
exports.getMyNotifications = getMyNotifications;
const markAsRead = async (req, res) => {
    try {
        await Notification_1.default.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ message: 'Marked as read' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating notification', error });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        await Notification_1.default.updateMany({ userId: req.user?._id, read: false }, { read: true });
        res.json({ message: 'All marked as read' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating notifications', error });
    }
};
exports.markAllAsRead = markAllAsRead;
