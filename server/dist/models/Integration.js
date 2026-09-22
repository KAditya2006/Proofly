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
const IntegrationSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    type: {
        type: String,
        enum: ['ERP', 'HRMS', 'FINANCE', 'DOCUMENT_STORAGE', 'IDENTITY_PROVIDER', 'OTHER'],
        required: true
    },
    protocol: {
        type: String,
        enum: ['REST_API', 'FILE_EXCHANGE', 'WEBHOOK'],
        required: true
    },
    status: {
        type: String,
        enum: ['NOT_CONFIGURED', 'CONFIGURED', 'CONNECTED', 'ERROR', 'DISABLED'],
        default: 'NOT_CONFIGURED'
    },
    config: {
        baseUrl: { type: String },
        authType: { type: String, enum: ['API_KEY', 'OAUTH2', 'BASIC', 'NONE'] },
        credentialsEncrypted: { type: String }, // In real app, this would be encrypted symmetric key
        webhookSecret: { type: String }
    },
    mappingRules: [{
            externalField: { type: String, required: true },
            indicatorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ESGIndicator', required: true },
            conversionFactor: { type: Number, default: 1 }
        }],
    syncSchedule: { type: String },
    lastSyncAt: { type: Date },
    lastSyncStatus: { type: String, enum: ['SUCCESS', 'FAILED', 'PARTIAL'] },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Integration', IntegrationSchema);
