import { Request as ExpressReq, Response as ExpressRes } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Organization from '../models/Organization';
import { AppError } from '../middleware/errorHandler';
import { logAudit } from '../utils/auditLogger';
import mongoose from 'mongoose';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req: any, res: ExpressRes) => {
  try {
    const users = await User.find().select('-passwordHash').populate('organizationId', 'name type code');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req: any, res: ExpressRes) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash').populate('organizationId', 'name type code');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    res.json(user);
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message, error: { code: error.errorCode } });
    res.status(500).json({ message: 'Server error fetching user' });
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req: any, res: ExpressRes) => {
  try {
    // Explicit whitelisting to prevent mass assignment
    const { name, email, mobileNo, password, role, organizationId } = req.body;

    if (!name || !email || !mobileNo || !password || !role) {
      throw new AppError('Missing required fields', 400, 'BAD_REQUEST');
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
      throw new AppError('Invalid role selection', 400, 'INVALID_ROLE');
    }

    const userExistsByEmail = await User.findOne({ email });
    if (userExistsByEmail) {
      throw new AppError('User already exists with this email', 400, 'USER_EXISTS');
    }

    if (organizationId && !mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new AppError('Invalid organization ID format', 400, 'INVALID_ORG_ID');
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

    // Auto-generate employeeId based on Role (e.g. MEIL-PO-0001)
    const rolePrefixes: Record<string, string> = {
      'PROJECT_OFFICER': 'PO',
      'BUSINESS_UNIT_REVIEWER': 'BU',
      'SUBSIDIARY_MANAGER': 'SM',
      'GROUP_ESG_TEAM': 'ESG',
      'AUDITOR': 'AUD',
      'ADMIN': 'ADM'
    };
    
    const prefix = `MEIL-${rolePrefixes[role] || 'EMP'}`;

    // Find highest employeeId with this prefix to auto-increment
    const lastUser = await User.findOne({ employeeId: { $regex: `^${prefix}-\\d+$` } })
      .sort({ employeeId: -1 })
      .exec();

    let nextNum = 1;
    if (lastUser && lastUser.employeeId) {
      const match = lastUser.employeeId.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const generatedEmployeeId = `${prefix}-${nextNum.toString().padStart(4, '0')}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      employeeId: generatedEmployeeId,
      mobileNo,
      passwordHash,
      role,
      organizationId: organizationId || null,
      isEmailVerified: true, // Since Admin provisions them, bypass OTP
      status: 'ACTIVE',
      mustChangePassword: true
    });

    await logAudit({
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
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message, error: { code: error.errorCode } });
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req: any, res: ExpressRes) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Explicit field whitelist
    const { name, mobileNo, role, organizationId, status } = req.body;
    
    const beforeState = { role: user.role, status: user.status, organizationId: user.organizationId };

    if (name) user.name = name;
    if (mobileNo) user.mobileNo = mobileNo;
    
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
        throw new AppError('Invalid role selection', 400, 'INVALID_ROLE');
      }
      user.role = role;
    }

    if (organizationId !== undefined) {
      if (organizationId && !mongoose.Types.ObjectId.isValid(organizationId)) {
        throw new AppError('Invalid organization ID format', 400, 'INVALID_ORG_ID');
      }
      user.organizationId = organizationId;
    }

    if (status) {
      const ALLOWED_STATUSES = ['ACTIVE', 'SUSPENDED', 'DISABLED'];
      if (!ALLOWED_STATUSES.includes(status)) {
        throw new AppError('Invalid status selection', 400, 'INVALID_STATUS');
      }
      user.status = status;
    }

    // Enforce limits for Reviewers and Managers (REMOVED)
    /*
    if (user.organizationId && user.status !== 'DISABLED') {
      if (user.role === 'BUSINESS_UNIT_REVIEWER') {
        const existingReviewer = await User.findOne({
          _id: { $ne: user._id },
          organizationId: user.organizationId,
          role: 'BUSINESS_UNIT_REVIEWER',
          status: { $ne: 'DISABLED' }
        });
        if (existingReviewer) {
          throw new AppError('This Business Unit already has an active Reviewer. Maximum 1 Reviewer allowed per BU.', 400, 'BU_REVIEWER_LIMIT_EXCEEDED');
        }
      }

      if (user.role === 'SUBSIDIARY_MANAGER') {
        const existingManager = await User.findOne({
          _id: { $ne: user._id },
          organizationId: user.organizationId,
          role: 'SUBSIDIARY_MANAGER',
          status: { $ne: 'DISABLED' }
        });
        if (existingManager) {
          throw new AppError('This Subsidiary already has an active Manager. Maximum 1 Manager allowed per Subsidiary.', 400, 'SUB_MANAGER_LIMIT_EXCEEDED');
        }
      }
    }
    */

    await user.save();

    await logAudit({
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
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message, error: { code: error.errorCode } });
    res.status(500).json({ message: 'Server error updating user' });
  }
};

// @desc    Delete (Disable) user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req: any, res: ExpressRes) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Hard deletion is prohibited due to orphaned dependencies (Audit, ESG Records, Reviews)
    // We soft-delete by changing status to DISABLED.
    user.status = 'DISABLED';
    await user.save();

    await logAudit({
      userId: req.user._id,
      action: 'USER_DISABLED',
      entityType: 'User',
      entityId: user._id.toString(),
      before: { status: 'ACTIVE' },
      after: { status: 'DISABLED' }
    });

    res.json({ success: true, message: 'User successfully disabled' });
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message, error: { code: error.errorCode } });
    res.status(500).json({ message: 'Server error deleting user' });
  }
};
