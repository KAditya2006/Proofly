"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const apiKeyAuth_1 = require("../../../middleware/apiKeyAuth");
const ESGRecord_1 = __importDefault(require("../../../models/ESGRecord"));
const ApiLog_1 = __importDefault(require("../../../models/ApiLog"));
const router = express_1.default.Router();
const apiV1Limiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'API rate limit exceeded' } }
});
router.use(apiV1Limiter);
// Middleware to log API usage
router.use(async (req, res, next) => {
    const start = Date.now();
    res.on('finish', async () => {
        try {
            await ApiLog_1.default.create({
                serviceAccountId: req.serviceAccount?._id,
                endpoint: req.originalUrl,
                method: req.method,
                statusCode: res.statusCode,
                durationMs: Date.now() - start,
                requestId: Array.isArray(req.headers['x-request-id']) ? req.headers['x-request-id'][0] : (req.headers['x-request-id'] || 'unknown'),
            });
        }
        catch (e) {
            console.error('Failed to write ApiLog', e);
        }
    });
    next();
});
// Protect all /api/v1 routes with API Key auth
router.use(apiKeyAuth_1.apiKeyAuth);
/**
 * GET /api/v1/esg/records
 * Returns APPROVED ESG records
 */
router.get('/esg/records', (0, apiKeyAuth_1.requireApiPermission)('ESG_RECORD_READ'), async (req, res) => {
    const account = req.serviceAccount;
    // Enforce organization scoping
    const filter = {
        organizationId: account.organizationId,
        status: 'APPROVED'
    };
    // Optional filtering by indicator, period, or project
    if (req.query.indicatorId)
        filter.indicatorId = req.query.indicatorId;
    if (req.query.reportingPeriodId)
        filter.reportingPeriodId = req.query.reportingPeriodId;
    if (req.query.projectId)
        filter.projectId = req.query.projectId;
    const records = await ESGRecord_1.default.find(filter)
        .populate('indicatorId', 'name category unit')
        .populate('projectId', 'name')
        .limit(1000); // hard limit to prevent abuse
    res.json({
        data: records,
        count: records.length,
        meta: {
            version: '1.0'
        }
    });
});
exports.default = router;
