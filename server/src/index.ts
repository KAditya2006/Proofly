import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import { requestCorrelation, CorrelatedRequest } from './middleware/requestCorrelation';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { checkSLAAndNotify } from './services/slaService';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import organizationRoutes from './routes/organizationRoutes';
import projectRoutes from './routes/projectRoutes';
import reportingRoutes from './routes/reportingRoutes';
import indicatorRoutes from './routes/indicatorRoutes';
import esgRecordRoutes from './routes/esgRecordRoutes';
import evidenceRoutes from './routes/evidenceRoutes';
import reviewRoutes from './routes/reviewRoutes';
import consolidationRoutes from './routes/consolidationRoutes';
import brsrCoreRoutes from './routes/brsrCoreRoutes';
import valueChainRoutes from './routes/valueChainRoutes';
import reportRoutes from './routes/reportRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import assuranceRoutes from './routes/assuranceRoutes';
import complianceRoutes from './routes/complianceRoutes';
import taskRoutes from './routes/taskRoutes';
import notificationRoutes from './routes/notificationRoutes';
import commentRoutes from './routes/commentRoutes';
import bulkUploadRoutes from './routes/bulkUploadRoutes';
import jobRoutes from './routes/jobRoutes';
import systemRoutes from './routes/systemRoutes';
import auditRoutes from './routes/auditRoutes';
import integrationRoutes from './routes/integrationRoutes';
import importBatchRoutes from './routes/importBatchRoutes';
import serviceAccountRoutes from './routes/serviceAccountRoutes';
import apiV1Routes from './routes/api/v1';
import path from 'path';

// Middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit body size to prevent large payload attacks
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(requestCorrelation);

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests from this IP, please try again after 15 minutes' } }
});
app.use('/api/', globalLimiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      requestId: (req as CorrelatedRequest).id
    });
  });
  next();
});

// Serve uploads statically (for MVP)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reporting-periods', reportingRoutes);
app.use('/api/indicators', indicatorRoutes);
app.use('/api/esg/records', esgRecordRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/consolidation', consolidationRoutes);
app.use('/api/brsr-core', brsrCoreRoutes);
app.use('/api/value-chain', valueChainRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assurance', assuranceRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/import-batches', importBatchRoutes);
app.use('/api/service-accounts', serviceAccountRoutes);
app.use('/api/v1', apiV1Routes);

// Health check endpoints for deployment validation
import mongoose from 'mongoose';
import { protect, authorize } from './middleware/authMiddleware';

app.get('/api/health', (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'ok' : 'error',
    database: dbState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/ready', (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  if (dbState === 1) {
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  } else {
    res.status(503).json({ status: 'not_ready', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

app.get('/api/health/detailed', protect, authorize('ADMIN'), (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    status: dbState === 1 ? 'HEALTHY' : 'DEGRADED',
    services: {
      application: 'HEALTHY',
      database: dbState === 1 ? 'HEALTHY' : 'UNAVAILABLE',
      authentication: 'HEALTHY', // Since we got past protect middleware
      storage: 'HEALTHY',
      backgroundJobs: 'HEALTHY'
    },
    metrics: {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB'
      },
      uptimeSeconds: Math.round(process.uptime()),
      version: process.env.npm_package_version || '1.0.0'
    },
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
} else {
  // Basic Route for development
  app.get('/', (req: Request, res: Response) => {
    res.send('MEIL ESG360 API Server is running.');
  });
}

// Global Error Handler (must be after all routes)
app.use(errorHandler);

// Start server
let server: any;
const startServer = async () => {
  try {
    // Phase 18: Environment Validation
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
    // FRONTEND_URL is highly recommended in production for CORS/Emails, but we won't crash if it's missing.
    if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
      console.warn('[WARN] FRONTEND_URL is missing. Emails or strict CORS might not work correctly.');
    }

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingVars.length > 0) {
      console.error(`[FATAL] Missing required environment variables: ${missingVars.join(', ')}`);
      process.exit(1);
    }

    await connectDB();
    server = app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port} in ${process.env.NODE_ENV || 'development'} mode`);
      
      // Start background SLA monitor (runs every 1 hour)
      const SLA_INTERVAL = 60 * 60 * 1000;
      setInterval(() => {
        checkSLAAndNotify().catch(err => console.error('SLA Background Task Error:', err));
      }, SLA_INTERVAL);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal. Closing HTTP server and database connections...');
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB connection closure', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
