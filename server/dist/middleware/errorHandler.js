"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    errorCode;
    isOperational;
    constructor(message, statusCode, errorCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    const reqId = req.id;
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        errorCode = err.errorCode;
        message = err.message;
    }
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_FAILED';
        message = err.message;
    }
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorCode = 'AUTH_REQUIRED';
        message = 'Invalid or expired token';
    }
    else if (err.name === 'CastError') {
        statusCode = 400;
        errorCode = 'INVALID_ID';
        message = 'Invalid resource ID format';
    }
    logger_1.logger.error(message, {
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
exports.errorHandler = errorHandler;
