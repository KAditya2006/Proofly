import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitInfo>();

// Simple in-memory rate limiter to avoid external dependencies per constraints
export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `${ip}:${req.path}`;
    
    let info = store.get(key);
    
    if (!info || now > info.resetTime) {
      info = { count: 1, resetTime: now + windowMs };
    } else {
      info.count++;
    }
    
    store.set(key, info);
    
    if (info.count > maxRequests) {
      logger.warn('Rate limit exceeded', { ip, path: req.path });
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.'
        }
      });
    }
    
    next();
  };
};

// Periodic cleanup of stale entries
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of store.entries()) {
    if (now > info.resetTime) {
      store.delete(key);
    }
  }
}, 60000).unref();
