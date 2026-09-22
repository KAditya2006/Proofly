import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import ServiceAccount from '../models/ServiceAccount';
import { AppError } from './errorHandler';

export interface ApiRequest extends Request {
  serviceAccount?: any;
}

export const apiKeyAuth = async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authorized, missing API Key', 401, 'AUTH_REQUIRED');
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
      throw new AppError('Missing X-Service-Account-Id header', 401, 'AUTH_REQUIRED');
    }

    const account = await ServiceAccount.findById(accountId);
    if (!account || account.status !== 'ACTIVE') {
      throw new AppError('Service Account not found or inactive', 401, 'AUTH_REQUIRED');
    }

    const isMatch = await bcrypt.compare(apiKey, account.apiKeyHash);
    if (!isMatch) {
      throw new AppError('Invalid API Key', 401, 'AUTH_REQUIRED');
    }

    // Check expiration
    if (account.expiresAt && new Date() > account.expiresAt) {
      account.status = 'EXPIRED';
      await account.save();
      throw new AppError('API Key expired', 401, 'AUTH_REQUIRED');
    }

    account.lastUsedAt = new Date();
    await account.save();

    req.serviceAccount = account;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireApiPermission = (permission: string) => {
  return (req: ApiRequest, res: Response, next: NextFunction) => {
    if (!req.serviceAccount) {
      return next(new AppError('Not authenticated as a service account', 401, 'AUTH_REQUIRED'));
    }
    
    if (!req.serviceAccount.permissions.includes(permission)) {
      return next(new AppError(`Missing required permission: ${permission}`, 403, 'FORBIDDEN'));
    }
    
    next();
  };
};
