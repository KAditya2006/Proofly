import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import ServiceAccount from '../models/ServiceAccount';
import { AppError } from '../middleware/errorHandler';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import AuditLog from '../models/AuditLog';

export const getServiceAccounts = async (req: AuthRequest, res: Response) => {
  const accounts = await ServiceAccount.find().populate('organizationId', 'name').sort({ createdAt: -1 });
  res.json(accounts);
};

export const createServiceAccount = async (req: AuthRequest, res: Response) => {
  const { name, organizationId, permissions } = req.body;
  
  // Generate a secure API key
  const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
  
  // Hash the key for storage
  const apiKeyHash = await bcrypt.hash(apiKey, 10);
  
  const account = await ServiceAccount.create({
    name,
    organizationId,
    permissions,
    apiKeyHash,
    createdBy: req.user!._id
  });

  await AuditLog.create({
    action: 'SERVICE_ACCOUNT_CREATED',
    entityType: 'ServiceAccount',
    entityId: account._id,
    userId: req.user!._id,
    before: {},
    after: { name, permissions, organizationId }
  });

  // Return the raw API key ONLY ONCE
  res.status(201).json({
    account,
    apiKey
  });
};

export const revokeServiceAccount = async (req: AuthRequest, res: Response) => {
  const account = await ServiceAccount.findByIdAndUpdate(
    req.params.id,
    { status: 'REVOKED' },
    { new: true }
  );
  
  if (!account) throw new AppError('Service account not found', 404, 'NOT_FOUND');

  await AuditLog.create({
    action: 'SERVICE_ACCOUNT_REVOKED',
    entityType: 'ServiceAccount',
    entityId: account._id,
    userId: req.user!._id,
    before: { status: 'ACTIVE' },
    after: { status: 'REVOKED' }
  });

  res.json(account);
};
