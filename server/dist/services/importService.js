"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Integration_1 = __importDefault(require("../models/Integration"));
const ImportBatch_1 = __importDefault(require("../models/ImportBatch"));
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const ConnectorFactory_1 = require("./connector/ConnectorFactory");
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
class ImportService {
    /**
     * Run a sync job for a given integration
     */
    static async runSync(integrationId, userId) {
        const integration = await Integration_1.default.findById(integrationId);
        if (!integration)
            throw new Error('Integration not found');
        const runningBatch = await ImportBatch_1.default.findOne({ integrationId: integration._id, status: 'PROCESSING' });
        if (runningBatch) {
            throw new Error('A sync job is already in progress for this integration');
        }
        const batch = await ImportBatch_1.default.create({
            integrationId: integration._id,
            source: integration.name,
            status: 'PROCESSING',
            startedAt: new Date(),
            createdBy: userId,
        });
        try {
            const connector = ConnectorFactory_1.ConnectorFactory.getConnector(integration);
            await connector.connect();
            const pullResult = await connector.pull();
            await connector.disconnect();
            if (!pullResult.success || !pullResult.data) {
                batch.status = 'FAILED';
                batch.syncErrors.push({ message: pullResult.message || 'Failed to pull data' });
                batch.completedAt = new Date();
                await batch.save();
                return batch;
            }
            const records = pullResult.data;
            batch.totalRecords = records.length;
            let validCount = 0;
            let rejectedCount = 0;
            let duplicateCount = 0;
            for (const record of records) {
                try {
                    // 1. Validate mandatory fields
                    if (!record.indicatorId || !record.value) {
                        rejectedCount++;
                        batch.syncErrors.push({
                            recordId: record.sourceRecordId,
                            message: 'Missing mandatory fields (indicatorId or value)',
                        });
                        continue;
                    }
                    // 2. Duplicate Detection
                    const existing = await ESGRecord_1.default.findOne({
                        sourceSystem: record.sourceSystem,
                        sourceRecordId: record.sourceRecordId
                    });
                    if (existing) {
                        duplicateCount++;
                        batch.syncErrors.push({
                            recordId: record.sourceRecordId,
                            message: 'Duplicate record skipped',
                        });
                        continue;
                    }
                    // 3. Create ESG Record (PENDING/DRAFT status, needs human approval if configured)
                    // For now, we put them as DRAFT or UNDER_REVIEW depending on requirements.
                    // Let's set to UNDER_REVIEW so it goes to reviewers.
                    await ESGRecord_1.default.create({
                        indicatorId: record.indicatorId,
                        organizationId: integration.createdBy, // Fallback, real implementation would map to correct org
                        reportingPeriodId: new mongoose_1.default.Types.ObjectId(), // Needs valid mapping in real life
                        value: record.value,
                        unit: record.unit,
                        sourceSystem: record.sourceSystem,
                        sourceRecordId: record.sourceRecordId,
                        sourceTimestamp: record.sourceTimestamp,
                        syncId: batch._id.toString(),
                        importBatchId: batch._id,
                        status: 'UNDER_REVIEW',
                        createdBy: userId,
                        source: `Integration: ${integration.name}`,
                        comments: record.comments
                    });
                    validCount++;
                }
                catch (err) {
                    rejectedCount++;
                    batch.syncErrors.push({
                        recordId: record.sourceRecordId,
                        message: err.message || 'Unknown error during import',
                    });
                }
            }
            batch.validRecords = validCount;
            batch.rejectedRecords = rejectedCount;
            batch.duplicateRecords = duplicateCount;
            batch.status = rejectedCount > 0 ? (validCount > 0 ? 'PARTIAL' : 'FAILED') : 'COMPLETED';
            batch.completedAt = new Date();
            await batch.save();
            integration.lastSyncAt = new Date();
            integration.lastSyncStatus = batch.status === 'COMPLETED' ? 'SUCCESS' : (batch.status === 'PARTIAL' ? 'PARTIAL' : 'FAILED');
            await integration.save();
            await AuditLog_1.default.create({
                action: 'INTEGRATION_SYNC',
                entityType: 'Integration',
                entityId: integration._id,
                userId: userId,
                before: {},
                after: { batchId: batch._id, status: batch.status, valid: validCount, rejected: rejectedCount }
            });
            return batch;
        }
        catch (error) {
            batch.status = 'FAILED';
            batch.syncErrors.push({ message: error.message || 'Internal sync error' });
            batch.completedAt = new Date();
            await batch.save();
            integration.lastSyncAt = new Date();
            integration.lastSyncStatus = 'FAILED';
            await integration.save();
            return batch;
        }
    }
}
exports.ImportService = ImportService;
