"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApiPermission = exports.apiKeyAuth = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ServiceAccount_1 = __importDefault(require("../models/ServiceAccount"));
const errorHandler_1 = require("./errorHandler");
const apiKeyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('Not authorized, missing API Key', 401, 'AUTH_REQUIRED');
        }
        const apiKey = authHeader.split(' ')[1];
        // In a highly optimized system we would cache this or use a prefix to lookup the specific account.
        // Since we don't store the raw key, we have to find it. 
        // A better approach is having the client send "AccountId:ApiKeySecret".
        // For simplicity here, we'll assume the API key itself has an ID prefix, e.g. "sk_accountId_randomStr".
        // Let's modify the requirement slightly to allow lookup. 
        // Wait, since we just have `apiKeyHash`, we'd have to scan all active accounts, which is O(N).
        // Let's assume the user passes a custom header `X-Service-Account-Id` or we expect the token as `accountId:secret`.
        // Let's use `X-Service-Account-Id`.
        const accountId = req.headers['x-service-account-id'];
        if (!accountId) {
            throw new errorHandler_1.AppError('Missing X-Service-Account-Id header', 401, 'AUTH_REQUIRED');
        }
        const account = await ServiceAccount_1.default.findById(accountId);
        if (!account || account.status !== 'ACTIVE') {
            throw new errorHandler_1.AppError('Service Account not found or inactive', 401, 'AUTH_REQUIRED');
        }
        const isMatch = await bcryptjs_1.default.compare(apiKey, account.apiKeyHash);
        if (!isMatch) {
            throw new errorHandler_1.AppError('Invalid API Key', 401, 'AUTH_REQUIRED');
        }
        // Check expiration
        if (account.expiresAt && new Date() > account.expiresAt) {
            account.status = 'EXPIRED';
            await account.save();
            throw new errorHandler_1.AppError('API Key expired', 401, 'AUTH_REQUIRED');
        }
        account.lastUsedAt = new Date();
        await account.save();
        req.serviceAccount = account;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.apiKeyAuth = apiKeyAuth;
const requireApiPermission = (permission) => {
    return (req, res, next) => {
        if (!req.serviceAccount) {
            return next(new errorHandler_1.AppError('Not authenticated as a service account', 401, 'AUTH_REQUIRED'));
        }
        if (!req.serviceAccount.permissions.includes(permission)) {
            return next(new errorHandler_1.AppError(`Missing required permission: ${permission}`, 403, 'FORBIDDEN'));
        }
        next();
    };
};
exports.requireApiPermission = requireApiPermission;
