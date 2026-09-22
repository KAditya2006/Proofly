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
const SystemSettingSchema = new mongoose_1.Schema({
    sessionTimeout: { type: String, default: '30' },
    maxFailedLogins: { type: String, default: '5' },
    passwordComplexity: { type: String, enum: ['low', 'medium', 'high'], default: 'high' },
    maintenanceMode: { type: Boolean, default: false },
    smtpHost: { type: String, default: 'smtp.meil.com' },
    smtpPort: { type: String, default: '587' },
    smtpUser: { type: String, default: 'no-reply@meil.com' },
    enableAuditLogging: { type: Boolean, default: true },
    dataRetentionDays: { type: String, default: '365' }
}, { timestamps: { createdAt: false, updatedAt: true } });
exports.default = mongoose_1.default.model('SystemSetting', SystemSettingSchema);
