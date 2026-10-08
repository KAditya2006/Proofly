"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ESGRecordSchema = new mongoose_1.Schema({
    indicatorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ESGIndicator', required: true, index: true },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', index: true },
    valueChainPartnerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ValueChainPartner', index: true },
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', required: true },
    reportingPeriodId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ReportingPeriod', required: true, index: true },
    value: { type: mongoose_1.Schema.Types.Mixed, required: true },
    unit: { type: String, required: true },
    source: { type: String },
    calculationMethod: { type: String },
    remarks: { type: String },
    evidenceIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Evidence' }],
    comments: { type: String },
    // GHG Calculation specific fields
    activityData: { type: Number },
    activityUnit: { type: String },
    emissionFactor: { type: Number },
    emissionFactorSource: { type: String },
    emissionFactorYear: { type: String },
    co2eResult: { type: Number },
    // Water Domain fields
    waterWithdrawal: { type: Number },
    waterDischarge: { type: Number },
    waterConsumption: { type: Number },
    // Waste Domain fields
    wasteCategory: { type: String, enum: ['HAZARDOUS', 'NON_HAZARDOUS'] },
    wasteDisposalMethod: { type: String, enum: ['RECYCLED', 'REUSED', 'RECOVERED', 'DISPOSED', 'LANDFILLED', 'INCINERATED', 'OTHER'] },
    wasteQuantity: { type: Number },
    // External Integration Provenance Fields
    sourceSystem: { type: String, trim: true },
    sourceRecordId: { type: String, trim: true },
    sourceTimestamp: { type: Date },
    syncId: { type: String, trim: true },
    importBatchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ImportBatch' },
    status: {
        type: String,
        enum: ['DRAFT', 'VALIDATION_FAILED', 'SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED', 'REJECTED'],
        default: 'DRAFT',
        index: true
    },
    correctionReason: { type: String },
    submittedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    buApprovedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    buApprovedAt: { type: Date },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    slaAlertSent: { type: Boolean, default: false },
}, { timestamps: true });
// High-value production indexes
ESGRecordSchema.index({ projectId: 1, indicatorId: 1, reportingPeriodId: 1 }, { unique: true });
ESGRecordSchema.index({ status: 1 });
ESGRecordSchema.index({ organizationId: 1 });
ESGRecordSchema.index({ importBatchId: 1 });
exports.default = mongoose_1.default.model('ESGRecord', ESGRecordSchema);
