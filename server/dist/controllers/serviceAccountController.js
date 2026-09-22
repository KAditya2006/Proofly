"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeServiceAccount = exports.createServiceAccount = exports.getServiceAccounts = void 0;
const ServiceAccount_1 = __importDefault(require("../models/ServiceAccount"));
const errorHandler_1 = require("../middleware/errorHandler");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const getServiceAccounts = async (req, res) => {
    const accounts = await ServiceAccount_1.default.find().populate('organizationId', 'name').sort({ createdAt: -1 });
    res.json(accounts);
};
exports.getServiceAccounts = getServiceAccounts;
const createServiceAccount = async (req, res) => {
    const { name, organizationId, permissions } = req.body;
    // Generate a secure API key
    const apiKey = `sk_${crypto_1.default.randomBytes(32).toString('hex')}`;
    // Hash the key for storage
    const apiKeyHash = await bcryptjs_1.default.hash(apiKey, 10);
    const account = await ServiceAccount_1.default.create({
        name,
        organizationId,
        permissions,
        apiKeyHash,
        createdBy: req.user._id
    });
    await AuditLog_1.default.create({
        action: 'SERVICE_ACCOUNT_CREATED',
        entityType: 'ServiceAccount',
        entityId: account._id,
        userId: req.user._id,
        before: {},
        after: { name, permissions, organizationId }
    });
    // Return the raw API key ONLY ONCE
    res.status(201).json({
        account,
        apiKey
    });
};
exports.createServiceAccount = createServiceAccount;
const revokeServiceAccount = async (req, res) => {
    const account = await ServiceAccount_1.default.findByIdAndUpdate(req.params.id, { status: 'REVOKED' }, { new: true });
    if (!account)
        throw new errorHandler_1.AppError('Service account not found', 404, 'NOT_FOUND');
    await AuditLog_1.default.create({
        action: 'SERVICE_ACCOUNT_REVOKED',
        entityType: 'ServiceAccount',
        entityId: account._id,
        userId: req.user._id,
        before: { status: 'ACTIVE' },
        after: { status: 'REVOKED' }
    });
    res.json(account);
};
exports.revokeServiceAccount = revokeServiceAccount;
