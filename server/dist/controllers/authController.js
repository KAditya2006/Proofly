"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPassword = exports.getMe = exports.changePassword = exports.loginUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const errorHandler_1 = require("../middleware/errorHandler");
const auditLogger_1 = require("../utils/auditLogger");
const emailService_1 = require("../utils/emailService");
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '8h',
    });
};
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
const loginUser = async (req, res) => {
    const { employeeId, password } = req.body;
    if (!employeeId || !password) {
        res.status(400).json({ success: false, error: { code: 'MISSING_CREDENTIALS', message: 'Employee ID and password are required' } });
        return;
    }
    try {
        const user = await User_1.default.findOne({ employeeId }).populate('organizationId');
        if (user && (await bcryptjs_1.default.compare(password, user.passwordHash))) {
            if (user.status !== 'ACTIVE') {
                await (0, auditLogger_1.logAudit)({
                    userId: user._id,
                    action: 'LOGIN_FAILED_SUSPENDED',
                    entityType: 'User',
                    entityId: user._id.toString(),
                    after: { employeeId }
                });
                throw new errorHandler_1.AppError(`Account is ${user.status.toLowerCase()}. Please contact administrator.`, 403, 'ACCOUNT_DISABLED');
            }
            await (0, auditLogger_1.logAudit)({
                userId: user._id,
                action: 'LOGIN_SUCCESS',
                entityType: 'User',
                entityId: user._id.toString(),
                after: { employeeId }
            });
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                employeeId: user.employeeId,
                role: user.role,
                organizationId: user.organizationId,
                mustChangePassword: user.mustChangePassword,
                token: generateToken(user._id.toString()),
            });
        }
        else {
            if (user) {
                await (0, auditLogger_1.logAudit)({
                    userId: user._id,
                    action: 'LOGIN_FAILED_CREDENTIALS',
                    entityType: 'User',
                    entityId: user._id.toString(),
                    after: { employeeId }
                });
            }
            throw new errorHandler_1.AppError('Invalid Employee ID or password', 401, 'INVALID_CREDENTIALS');
        }
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ success: false, error: { code: error.errorCode, message: error.message } });
        }
        else {
            res.status(500).json({ message: 'Server error during login' });
        }
    }
};
exports.loginUser = loginUser;
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User_1.default.findById(req.user?._id);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        if (!(await bcryptjs_1.default.compare(currentPassword, user.passwordHash))) {
            throw new errorHandler_1.AppError('Incorrect current password', 400, 'INVALID_PASSWORD');
        }
        if (newPassword.length < 8) {
            throw new errorHandler_1.AppError('New password must be at least 8 characters long', 400, 'WEAK_PASSWORD');
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        user.mustChangePassword = false;
        await user.save();
        await (0, auditLogger_1.logAudit)({
            userId: user._id,
            action: 'PASSWORD_CHANGED',
            entityType: 'User',
            entityId: user._id.toString(),
        });
        res.json({ success: true, message: 'Password updated successfully' });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ success: false, error: { code: error.errorCode, message: error.message } });
        }
        else {
            res.status(500).json({ message: 'Server error updating password' });
        }
    }
};
exports.changePassword = changePassword;
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user?._id).populate('organizationId').select('-passwordHash');
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching user details' });
    }
};
exports.getMe = getMe;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ message: 'Email is required' });
        return;
    }
    try {
        const user = await User_1.default.findOne({ email });
        if (!user) {
            // Return 200 to prevent email enumeration attacks
            res.json({ success: true, message: 'If an account with this email exists, a reset link has been sent.' });
            return;
        }
        const dummyPassword = (0, emailService_1.generateSecurePassword)(12);
        const salt = await bcryptjs_1.default.genSalt(10);
        user.passwordHash = await bcryptjs_1.default.hash(dummyPassword, salt);
        user.mustChangePassword = true;
        await user.save();
        // Reusing OTP email function to send dummy password since it's the requested flow
        await (0, emailService_1.sendForgotPasswordOTP)(email, dummyPassword);
        await (0, auditLogger_1.logAudit)({
            userId: user._id,
            action: 'PASSWORD_RESET_REQUESTED',
            entityType: 'User',
            entityId: user._id.toString(),
        });
        res.json({ success: true, message: 'Password reset successful. Check your email.' });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error processing request' });
    }
};
exports.forgotPassword = forgotPassword;
