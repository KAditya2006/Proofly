import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { CorrelatedRequest } from './requestCorrelation';

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const reqId = (req as CorrelatedRequest).id;
  
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_FAILED';
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'AUTH_REQUIRED';
    message = 'Invalid or expired token';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid resource ID format';
  }
  
  logger.error(message, {
    requestId: reqId,
    errorCode,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      requestId: reqId
    }
  });
};
