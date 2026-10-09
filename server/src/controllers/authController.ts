import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../middleware/errorHandler';
import { logAudit } from '../utils/auditLogger';
import { generateSecurePassword, sendForgotPasswordOTP } from '../utils/emailService';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '8h',
  });
};

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};



export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { employeeId, password } = req.body;

  if (!employeeId || !password) {
    res.status(400).json({ success: false, error: { code: 'MISSING_CREDENTIALS', message: 'Employee ID and password are required' } });
    return;
  }

  try {
    const user = await User.findOne({ employeeId }).populate('organizationId');

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      if (user.status !== 'ACTIVE') {
        await logAudit({
          userId: user._id,
          action: 'LOGIN_FAILED_SUSPENDED',
          entityType: 'User',
          entityId: user._id.toString(),
          after: { employeeId }
        });
        throw new AppError(`Account is ${user.status.toLowerCase()}. Please contact administrator.`, 403, 'ACCOUNT_DISABLED');
      }

      await logAudit({
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
    } else {
      if (user) {
        await logAudit({
          userId: user._id,
          action: 'LOGIN_FAILED_CREDENTIALS',
          entityType: 'User',
          entityId: user._id.toString(),
          after: { employeeId }
        });
      }
      throw new AppError('Invalid Employee ID or password', 401, 'INVALID_CREDENTIALS');
    }
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, error: { code: error.errorCode, message: error.message } });
    } else {
      res.status(500).json({ message: 'Server error during login' });
    }
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new AppError('Incorrect current password', 400, 'INVALID_PASSWORD');
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long', 400, 'WEAK_PASSWORD');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    
    await user.save();

    await logAudit({
      userId: user._id,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user._id.toString(),
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, error: { code: error.errorCode, message: error.message } });
    } else {
      res.status(500).json({ message: 'Server error updating password' });
    }
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).populate('organizationId').select('-passwordHash');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user details' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 to prevent email enumeration attacks
      res.json({ success: true, message: 'If an account with this email exists, a reset link has been sent.' });
      return;
    }

    const dummyPassword = generateSecurePassword(12);
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(dummyPassword, salt);
    user.mustChangePassword = true;
    await user.save();

    // Reusing OTP email function to send dummy password since it's the requested flow
    await sendForgotPasswordOTP(email, dummyPassword);

    await logAudit({
      userId: user._id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user._id.toString(),
    });

    res.json({ success: true, message: 'Password reset successful. Check your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error processing request' });
  }
};
