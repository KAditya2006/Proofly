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
const ESGIndicatorSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: {
        type: String,
        enum: ['ENVIRONMENT', 'SOCIAL', 'GOVERNANCE'],
        required: true
    },
    subcategory: { type: String },
    unit: { type: String, required: true },
    description: { type: String },
    dataType: {
        type: String,
        enum: ['NUMBER', 'STRING', 'BOOLEAN', 'OPTIONS'],
        required: true
    },
    options: [{ type: String }],
    frequency: {
        type: String,
        enum: ['MONTHLY', 'QUARTERLY', 'ANNUALLY'],
        default: 'ANNUALLY'
    },
    aggregationMethod: {
        type: String,
        enum: ['SUM', 'AVERAGE', 'COUNT', 'RATIO', 'PERCENTAGE', 'INTENSITY'],
        default: 'SUM'
    },
    mandatory: { type: Boolean, default: false },
    isGHG: { type: Boolean, default: false },
    isWater: { type: Boolean, default: false },
    isWaste: { type: Boolean, default: false },
    validationRules: [{
            type: { type: String, enum: ['NUMERIC_MIN', 'NUMERIC_MAX', 'REQUIRED', 'LOGICAL', 'VARIANCE_MAX'] },
            value: { type: mongoose_1.Schema.Types.Mixed },
            expression: { type: String },
            errorMessage: { type: String }
        }],
    brsrMappings: [{
            section: { type: String },
            principle: { type: String },
            disclosure: { type: String }
        }],
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true });
exports.default = mongoose_1.default.model('ESGIndicator', ESGIndicatorSchema);
