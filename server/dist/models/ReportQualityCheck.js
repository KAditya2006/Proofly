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
const ReportQualityCheckSchema = new mongoose_1.Schema({
    reportId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Report', required: true, unique: true },
    status: { type: String, enum: ['READY', 'WARNING', 'BLOCKED'], required: true },
    checks: {
        dataCompleteness: {
            status: { type: String, enum: ['PASS', 'FAIL', 'WARNING'] },
            message: String,
            details: mongoose_1.Schema.Types.Mixed
        },
        validation: {
            status: { type: String, enum: ['PASS', 'FAIL'] },
            message: String,
            details: mongoose_1.Schema.Types.Mixed
        },
        evidenceCoverage: {
            status: { type: String, enum: ['PASS', 'FAIL', 'WARNING'] },
            message: String,
            details: mongoose_1.Schema.Types.Mixed
        },
        brsrMapping: {
            status: { type: String, enum: ['PASS', 'FAIL', 'WARNING'] },
            message: String,
            details: mongoose_1.Schema.Types.Mixed
        },
        assuranceControls: {
            status: { type: String, enum: ['PASS', 'FAIL', 'WARNING'] },
            message: String,
            details: mongoose_1.Schema.Types.Mixed
        },
        governance: {
            status: { type: String, enum: ['PASS', 'FAIL'] },
            message: String,
            details: mongoose_1.Schema.Types.Mixed
        }
    },
    anomalies: [{
            type: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'] },
            message: String,
            disclosureCode: String,
            indicatorCode: String,
            details: mongoose_1.Schema.Types.Mixed,
            resolved: { type: Boolean, default: false },
            resolvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
        }],
    runAt: { type: Date, default: Date.now }
}, { timestamps: true });
exports.default = mongoose_1.default.model('ReportQualityCheck', ReportQualityCheckSchema);
