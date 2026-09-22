import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user) {
        res.status(401).json({ message: 'Not authorized, user not found' });
        return;
      }

      if (user.mustChangePassword) {
        const allowedPaths = ['/change-password', '/me'];
        const isAllowed = allowedPaths.some(p => req.originalUrl.includes(p));
        if (!isAllowed) {
          res.status(403).json({ message: 'Password change required', code: 'PASSWORD_CHANGE_REQUIRED' });
          return;
        }
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Not authorized to access this route' });
      return;
    }
    next();
  };
};
