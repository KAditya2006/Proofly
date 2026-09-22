import express from 'express';
import rateLimit from 'express-rate-limit';
import { apiKeyAuth, requireApiPermission, ApiRequest } from '../../../middleware/apiKeyAuth';
import ESGRecord from '../../../models/ESGRecord';
import ApiLog from '../../../models/ApiLog';

const router = express.Router();

const apiV1Limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'API rate limit exceeded' } }
});

router.use(apiV1Limiter);

// Middleware to log API usage
router.use(async (req: ApiRequest, res, next) => {
  const start = Date.now();
  res.on('finish', async () => {
    try {
      await ApiLog.create({
        serviceAccountId: req.serviceAccount?._id,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        requestId: Array.isArray(req.headers['x-request-id']) ? req.headers['x-request-id'][0] : (req.headers['x-request-id'] || 'unknown'),
      });
    } catch (e) {
      console.error('Failed to write ApiLog', e);
    }
  });
  next();
});

// Protect all /api/v1 routes with API Key auth
router.use(apiKeyAuth);

/**
 * GET /api/v1/esg/records
 * Returns APPROVED ESG records
 */
router.get('/esg/records', requireApiPermission('ESG_RECORD_READ'), async (req: ApiRequest, res) => {
  const account = req.serviceAccount;
  
  // Enforce organization scoping
  const filter: any = {
    organizationId: account.organizationId,
    status: 'APPROVED'
  };

  // Optional filtering by indicator, period, or project
  if (req.query.indicatorId) filter.indicatorId = req.query.indicatorId;
  if (req.query.reportingPeriodId) filter.reportingPeriodId = req.query.reportingPeriodId;
  if (req.query.projectId) filter.projectId = req.query.projectId;

  const records = await ESGRecord.find(filter)
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

export default router;
