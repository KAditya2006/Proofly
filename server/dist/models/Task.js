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
const TaskSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String },
    assigneeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    assignerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', required: true },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project' },
    indicatorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ESGIndicator' },
    priority: {
        type: String,
        enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
        default: 'MEDIUM'
    },
    dueDate: { type: Date },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'],
        default: 'OPEN',
        index: true
    },
    referenceType: {
        type: String,
        enum: ['ESGRecord', 'ValidationIssue', 'AssuranceFinding', 'BRSRDisclosure']
    },
    referenceId: { type: mongoose_1.Schema.Types.ObjectId }
}, { timestamps: true });
TaskSchema.index({ assigneeId: 1, status: 1 });
TaskSchema.index({ organizationId: 1 });
TaskSchema.index({ dueDate: 1 });
exports.default = mongoose_1.default.model('Task', TaskSchema);
