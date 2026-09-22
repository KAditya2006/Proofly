"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
const sanitize = (obj) => {
    if (!obj)
        return obj;
    if (typeof obj !== 'object')
        return obj;
    const sanitized = { ...obj };
    const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'passwordHash'];
    for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            sanitized[key] = '[REDACTED]';
        }
        else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitize(sanitized[key]);
        }
    }
    return sanitized;
};
const formatLog = (level, message, meta = {}) => {
    const payload = {
        level,
        timestamp: new Date().toISOString(),
        message,
        ...sanitize(meta)
    };
    // Format as single line JSON for log aggregators
    return JSON.stringify(payload);
};
exports.logger = {
    debug: (message, meta) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(formatLog(LogLevel.DEBUG, message, meta));
        }
    },
    info: (message, meta) => {
        console.info(formatLog(LogLevel.INFO, message, meta));
    },
    warn: (message, meta) => {
        console.warn(formatLog(LogLevel.WARN, message, meta));
    },
    error: (message, meta) => {
        console.error(formatLog(LogLevel.ERROR, message, meta));
    }
};
