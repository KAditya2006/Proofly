"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const Organization_1 = __importDefault(require("../models/Organization"));
const errorHandler_1 = require("../middleware/errorHandler");
const auditLogger_1 = require("../utils/auditLogger");
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User_1.default.find().select('-passwordHash').populate('organizationId', 'name type code');
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching users' });
    }
};
exports.getUsers = getUsers;
// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id).select('-passwordHash').populate('organizationId', 'name type code');
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404, 'NOT_FOUND');
        }
        res.json(user);
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            return res.status(error.statusCode).json({ message: error.message, error: { code: error.errorCode } });
        res.status(500).json({ message: 'Server error fetching user' });
    }
};
exports.getUserById = getUserById;
// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
    try {
        // Explicit whitelisting to prevent mass assignment
        const { name, email, mobileNo, password, role, organizationId } = req.body;
        if (!name || !email || !mobileNo || !password || !role) {
            throw new errorHandler_1.AppError('Missing required fields', 400, 'BAD_REQUEST');
        }
        const ALLOWED_ROLES = [
            'PROJECT_OFFICER',
            'BUSINESS_UNIT_REVIEWER',
            'SUBSIDIARY_MANAGER',
            'GROUP_ESG_TEAM',
            'AUDITOR',
            'ADMIN' // Admin can create another Admin
        ];
        if (!ALLOWED_ROLES.includes(role)) {
            throw new errorHandler_1.AppError('Invalid role selection', 400, 'INVALID_ROLE');
        }
        const userExistsByEmail = await User_1.default.findOne({ email });
        if (userExistsByEmail) {
            throw new errorHandler_1.AppError('User already exists with this email', 400, 'USER_EXISTS');
        }
        if (organizationId && !mongoose_1.default.Types.ObjectId.isValid(organizationId)) {
            throw new errorHandler_1.AppError('Invalid organization ID format', 400, 'INVALID_ORG_ID');
        }
        // Enforce limits for Reviewers and Managers (REMOVED)
        /*
        if (organizationId) {
          if (role === 'BUSINESS_UNIT_REVIEWER') {
            const existingReviewer = await User.findOne({
              organizationId,
              role: 'BUSINESS_UNIT_REVIEWER',
              status: { $ne: 'DISABLED' }
            });
            if (existingReviewer) {
              throw new AppError('This Business Unit already has an active Reviewer. Maximum 1 Reviewer allowed per BU.', 400, 'BU_REVIEWER_LIMIT_EXCEEDED');
            }
          }
    
          if (role === 'SUBSIDIARY_MANAGER') {
            const existingManager = await User.findOne({
              organizationId,
              role: 'SUBSIDIARY_MANAGER',
              status: { $ne: 'DISABLED' }
            });
            if (existingManager) {
              throw new AppError('This Subsidiary already has an active Manager. Maximum 1 Manager allowed per Subsidiary.', 400, 'SUB_MANAGER_LIMIT_EXCEEDED');
            }
          }
        }
        */
        // Auto-generate employeeId based on Role
        const rolePrefixes = {
            'PROJECT_OFFICER': 'PO',
            'BUSINESS_UNIT_REVIEWER': 'BU',
            'SUBSIDIARY_MANAGER': 'SM',
            'GROUP_ESG_TEAM': 'ESG',
            'AUDITOR': 'AUD',
            'ADMIN': 'ADM'
        };
        const prefix = `MEIL-${rolePrefixes[role] || 'EMP'}`;
        const existingUsers = await User_1.default.find({ employeeId: { $regex: `^${prefix}-\\d+$` } }, 'employeeId');
        const existingNums = existingUsers
            .map(u => {
            const match = u.employeeId.match(new RegExp(`^${prefix}-(\\d+)$`));
            return match ? parseInt(match[1], 10) : 0;
        })
            .filter(n => n > 0)
            .sort((a, b) => a - b);
        let nextNum = 1;
        for (const num of existingNums) {
            if (num === nextNum) {
                nextNum++;
            }
            else if (num > nextNum) {
                break;
            }
        }
        const generatedEmployeeId = `${prefix}-${nextNum.toString().padStart(4, '0')}`;
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Organization Context Logic
        let finalOrgId;
        if (role === 'ADMIN' || role === 'AUDITOR' || role === 'GROUP_ESG_TEAM') {
            let meilGroup = await Organization_1.default.findOne({ type: 'GROUP' });
            if (!meilGroup) {
                meilGroup = await Organization_1.default.create({
                    name: 'MEIL Group',
                    type: 'GROUP',
                    code: 'MEIL-GRP',
                    location: 'HQ',
                    status: 'ACTIVE'
                });
            }
            finalOrgId = meilGroup._id;
        }
        else {
            if (!organizationId) {
                throw new errorHandler_1.AppError('Organization context is required for this role', 400, 'MISSING_ORG_ID');
            }
            const org = await Organization_1.default.findById(organizationId);
            if (!org) {
                throw new errorHandler_1.AppError('Selected Organization not found', 404, 'NOT_FOUND');
            }
            finalOrgId = org._id;
        }
        const user = await User_1.default.create({
            name,
            email,
            employeeId: generatedEmployeeId,
            mobileNo,
            passwordHash,
            role,
            organizationId: finalOrgId,
            isEmailVerified: true,
            status: 'ACTIVE',
            mustChangePassword: true
        });
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'USER_CREATED',
            entityType: 'User',
            entityId: user._id.toString(),
            after: { email: user.email, employeeId: user.employeeId, role: user.role, organizationId: user.organizationId }
        });
        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                employeeId: user.employeeId,
                role: user.role
            }
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            return res.status(error.statusCode).json({ message: error.message, error: { code: error.errorCode } });
        console.error('Create User Error:', error);
        res.status(500).json({ message: 'Server error creating user' });
    }
};
exports.createUser = createUser;
// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404, 'NOT_FOUND');
        }
        // Explicit field whitelist
        const { name, mobileNo, role, organizationId, status } = req.body;
        const beforeState = { role: user.role, status: user.status, organizationId: user.organizationId };
        if (name)
            user.name = name;
        if (mobileNo)
            user.mobileNo = mobileNo;
        if (role) {
            const ALLOWED_ROLES = [
                'PROJECT_OFFICER',
                'BUSINESS_UNIT_REVIEWER',
                'SUBSIDIARY_MANAGER',
                'GROUP_ESG_TEAM',
                'AUDITOR',
                'ADMIN'
            ];
            if (!ALLOWED_ROLES.includes(role)) {
                throw new errorHandler_1.AppError('Invalid role selection', 400, 'INVALID_ROLE');
            }
            user.role = role;
        }
        if (organizationId !== undefined) {
            if (organizationId && !mongoose_1.default.Types.ObjectId.isValid(organizationId)) {
                throw new errorHandler_1.AppError('Invalid organization ID format', 400, 'INVALID_ORG_ID');
            }
            // Map manager ID to proper organization ID
            if (!organizationId) {
                user.organizationId = null;
            }
            else if (role === 'PROJECT_OFFICER' || role === 'BUSINESS_UNIT_REVIEWER') {
                const managerUser = await User_1.default.findById(organizationId);
                if (managerUser) {
                    if (role === 'PROJECT_OFFICER') {
                        user.organizationId = managerUser.organizationId;
                    }
                    else if (role === 'BUSINESS_UNIT_REVIEWER') {
                        // For updating a BU reviewer, we might ideally want to move their BU to a new subsidiary, 
                        // but for simplicity, we just keep their current BU or create a new one under the new manager
                        if (!user.organizationId) {
                            const newBU = await Organization_1.default.create({
                                name: `${user.name}'s BU`,
                                type: 'BUSINESS_UNIT',
                                parentId: managerUser.organizationId,
                                code: `BU-${Date.now().toString().slice(-6)}`,
                                status: 'ACTIVE'
                            });
                            user.organizationId = newBU._id;
                        }
                        else {
                            // Update existing BU's parent
                            await Organization_1.default.findByIdAndUpdate(user.organizationId, { parentId: managerUser.organizationId });
                        }
                    }
                }
            }
        }
        if (status) {
            const ALLOWED_STATUSES = ['ACTIVE', 'SUSPENDED', 'DISABLED'];
            if (!ALLOWED_STATUSES.includes(status)) {
                throw new errorHandler_1.AppError('Invalid status selection', 400, 'INVALID_STATUS');
            }
            user.status = status;
        }
        await user.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'USER_UPDATED',
            entityType: 'User',
            entityId: user._id.toString(),
            before: beforeState,
            after: { role: user.role, status: user.status, organizationId: user.organizationId }
        });
        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            return res.status(error.statusCode).json({ message: error.message, error: { code: error.errorCode } });
        res.status(500).json({ message: 'Server error updating user' });
    }
};
exports.updateUser = updateUser;
// @desc    Delete (Disable) user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404, 'NOT_FOUND');
        }
        // Hard deletion is prohibited due to orphaned dependencies (Audit, ESG Records, Reviews)
        // We soft-delete by changing status to DISABLED and freeing up email and employeeId.
        const oldEmployeeId = user.employeeId;
        const oldEmail = user.email;
        user.status = 'DISABLED';
        user.email = `${user.email}_deleted_${Date.now()}`;
        if (user.employeeId) {
            user.employeeId = `${user.employeeId}_deleted_${Date.now()}`;
        }
        await user.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'USER_DISABLED',
            entityType: 'User',
            entityId: user._id.toString(),
            before: { status: 'ACTIVE', email: oldEmail, employeeId: oldEmployeeId },
            after: { status: 'DISABLED', email: user.email, employeeId: user.employeeId }
        });
        res.json({ success: true, message: 'User successfully disabled' });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            return res.status(error.statusCode).json({ message: error.message, error: { code: error.errorCode } });
        res.status(500).json({ message: 'Server error deleting user' });
    }
};
exports.deleteUser = deleteUser;
