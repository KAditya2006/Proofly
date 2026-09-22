import { Request } from 'express';

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogPayload {
  level: LogLevel;
  timestamp: string;
  message: string;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  durationMs?: number;
  [key: string]: any;
}

const sanitize = (obj: any): any => {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'passwordHash'];
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }
  return sanitized;
};

const formatLog = (level: LogLevel, message: string, meta: Record<string, any> = {}) => {
  const payload: LogPayload = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...sanitize(meta)
  };
  
  // Format as single line JSON for log aggregators
  return JSON.stringify(payload);
};

export const logger = {
  debug: (message: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog(LogLevel.DEBUG, message, meta));
    }
  },
  info: (message: string, meta?: Record<string, any>) => {
    console.info(formatLog(LogLevel.INFO, message, meta));
  },
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(formatLog(LogLevel.WARN, message, meta));
  },
  error: (message: string, meta?: Record<string, any>) => {
    console.error(formatLog(LogLevel.ERROR, message, meta));
  }
};
