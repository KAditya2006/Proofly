import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface CorrelatedRequest extends Request {
  id: string;
}

export const requestCorrelation = (req: Request, res: Response, next: NextFunction) => {
  const reqId = req.headers['x-request-id'] as string || `req_${crypto.randomUUID()}`;
  
  (req as CorrelatedRequest).id = reqId;
  
  // Set on response so client can trace
  res.setHeader('X-Request-ID', reqId);
  
  next();
};
