"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoConnector = void 0;
const BaseConnector_1 = require("./BaseConnector");
class DemoConnector extends BaseConnector_1.BaseConnector {
    async connect() {
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, message: 'Connected to Demo ERP successfully' };
    }
    async disconnect() {
        return { success: true, message: 'Disconnected' };
    }
    async healthCheck() {
        return { success: true, message: 'System is healthy' };
    }
    async pull(startDate, endDate) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Generate some mock records to demonstrate integration
        const records = [];
        // Check if we have any mapping rules
        if (!this.integration.mappingRules || this.integration.mappingRules.length === 0) {
            return { success: false, message: 'No mapping rules defined for this integration.' };
        }
        // For each mapping rule, generate some fake external data
        for (const rule of this.integration.mappingRules) {
            const numRecords = Math.floor(Math.random() * 5) + 1; // 1 to 5 records per rule
            for (let i = 0; i < numRecords; i++) {
                const rawValue = Math.floor(Math.random() * 1000) + 100;
                records.push({
                    sourceSystem: this.integration.name,
                    sourceRecordId: `EXT-${rule.externalField}-${Date.now()}-${i}`,
                    sourceTimestamp: new Date(Date.now() - Math.random() * 86400000 * 30), // Random time in last 30 days
                    externalField: rule.externalField,
                    indicatorId: rule.indicatorId,
                    value: rawValue * (rule.conversionFactor || 1), // Apply conversion factor
                    unit: 'NormalizedUnit', // Ideally the mapping would define this
                    comments: `Imported via ${this.integration.name} mapping ${rule.externalField}`
                });
            }
        }
        // Generate one duplicate (same ID as something we might have already imported)
        // To test duplicate logic, we could use a fixed ID
        if (this.integration.mappingRules.length > 0) {
            const rule = this.integration.mappingRules[0];
            records.push({
                sourceSystem: this.integration.name,
                sourceRecordId: `EXT-FIXED-DUPE-ID-001`,
                sourceTimestamp: new Date(),
                externalField: rule.externalField,
                indicatorId: rule.indicatorId,
                value: 500,
                unit: 'FixedUnit',
                comments: 'This record tests duplicate detection'
            });
        }
        // Generate one invalid record (missing indicator)
        records.push({
            sourceSystem: this.integration.name,
            sourceRecordId: `EXT-INVALID-${Date.now()}`,
            sourceTimestamp: new Date(),
            externalField: 'UnknownField',
            indicatorId: null, // Will fail validation
            value: 100,
            unit: 'Unknown'
        });
        return {
            success: true,
            data: records
        };
    }
    async push(data) {
        return { success: true, message: 'Data pushed successfully (mock)' };
    }
}
exports.DemoConnector = DemoConnector;
