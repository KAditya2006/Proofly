"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const db_1 = require("./config/db");
const requestCorrelation_1 = require("./middleware/requestCorrelation");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const slaService_1 = require("./services/slaService");
dotenv_1.default.config();
// Force nodemon restart
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const organizationRoutes_1 = __importDefault(require("./routes/organizationRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const reportingRoutes_1 = __importDefault(require("./routes/reportingRoutes"));
const indicatorRoutes_1 = __importDefault(require("./routes/indicatorRoutes"));
const esgRecordRoutes_1 = __importDefault(require("./routes/esgRecordRoutes"));
const evidenceRoutes_1 = __importDefault(require("./routes/evidenceRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const consolidationRoutes_1 = __importDefault(require("./routes/consolidationRoutes"));
const brsrCoreRoutes_1 = __importDefault(require("./routes/brsrCoreRoutes"));
const valueChainRoutes_1 = __importDefault(require("./routes/valueChainRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const assuranceRoutes_1 = __importDefault(require("./routes/assuranceRoutes"));
const complianceRoutes_1 = __importDefault(require("./routes/complianceRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const bulkUploadRoutes_1 = __importDefault(require("./routes/bulkUploadRoutes"));
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
const systemRoutes_1 = __importDefault(require("./routes/systemRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const integrationRoutes_1 = __importDefault(require("./routes/integrationRoutes"));
const importBatchRoutes_1 = __importDefault(require("./routes/importBatchRoutes"));
const serviceAccountRoutes_1 = __importDefault(require("./routes/serviceAccountRoutes"));
const v1_1 = __importDefault(require("./routes/api/v1"));
const path_1 = __importDefault(require("path"));
// Middleware
app.use((0, helmet_1.default)()); // Secure HTTP headers
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' })); // Limit body size to prevent large payload attacks
app.use((0, express_mongo_sanitize_1.default)()); // Prevent NoSQL injection
app.use(requestCorrelation_1.requestCorrelation);
// Global Rate Limiting
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests from this IP, please try again after 15 minutes' } }
});
app.use('/api/', globalLimiter);
// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info('API Request', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: duration,
            requestId: req.id
        });
    });
    next();
});
// Serve uploads statically (for MVP)
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/organizations', organizationRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.use('/api/reporting-periods', reportingRoutes_1.default);
app.use('/api/indicators', indicatorRoutes_1.default);
app.use('/api/esg/records', esgRecordRoutes_1.default);
app.use('/api/evidence', evidenceRoutes_1.default);
app.use('/api/reviews', reviewRoutes_1.default);
app.use('/api/consolidation', consolidationRoutes_1.default);
app.use('/api/brsr-core', brsrCoreRoutes_1.default);
app.use('/api/value-chain', valueChainRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/assurance', assuranceRoutes_1.default);
app.use('/api/compliance', complianceRoutes_1.default);
app.use('/api/tasks', taskRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/comments', commentRoutes_1.default);
app.use('/api/bulk-upload', bulkUploadRoutes_1.default);
app.use('/api/jobs', jobRoutes_1.default);
app.use('/api/system', systemRoutes_1.default);
app.use('/api/audit', auditRoutes_1.default);
app.use('/api/integrations', integrationRoutes_1.default);
app.use('/api/import-batches', importBatchRoutes_1.default);
app.use('/api/service-accounts', serviceAccountRoutes_1.default);
app.use('/api/v1', v1_1.default);
// Health check endpoints for deployment validation
const mongoose_1 = __importDefault(require("mongoose"));
const authMiddleware_1 = require("./middleware/authMiddleware");
app.get('/api/health', (req, res) => {
    const dbState = mongoose_1.default.connection.readyState;
    res.status(dbState === 1 ? 200 : 503).json({
        status: dbState === 1 ? 'ok' : 'error',
        database: dbState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});
app.get('/api/ready', (req, res) => {
    const dbState = mongoose_1.default.connection.readyState;
    if (dbState === 1) {
        res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
    }
    else {
        res.status(503).json({ status: 'not_ready', database: 'disconnected', timestamp: new Date().toISOString() });
    }
});
app.get('/api/health/detailed', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('ADMIN'), (req, res) => {
    const dbState = mongoose_1.default.connection.readyState;
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
    app.use(express_1.default.static(path_1.default.join(__dirname, '../../client/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../../client/dist/index.html'));
    });
}
else {
    // Basic Route for development
    app.get('/', (req, res) => {
        res.send('MEIL ESG360 API Server is running.');
    });
}
// Global Error Handler (must be after all routes)
app.use(errorHandler_1.errorHandler);
// Start server
let server;
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
        await (0, db_1.connectDB)();
        server = app.listen(port, () => {
            console.log(`[server]: Server is running at http://localhost:${port} in ${process.env.NODE_ENV || 'development'} mode`);
            // Start background SLA monitor (runs every 1 hour)
            const SLA_INTERVAL = 60 * 60 * 1000;
            setInterval(() => {
                (0, slaService_1.checkSLAAndNotify)().catch(err => console.error('SLA Background Task Error:', err));
            }, SLA_INTERVAL);
        });
    }
    catch (error) {
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
                await mongoose_1.default.connection.close();
                console.log('MongoDB connection closed.');
                process.exit(0);
            }
            catch (err) {
                console.error('Error during MongoDB connection closure', err);
                process.exit(1);
            }
        });
    }
    else {
        process.exit(0);
    }
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
