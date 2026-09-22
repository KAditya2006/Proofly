import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Integration from '../models/Integration';
import { AppError } from '../middleware/errorHandler';
import { ImportService } from '../services/importService';

export const getIntegrations = async (req: AuthRequest, res: Response) => {
  const integrations = await Integration.find().sort({ createdAt: -1 });
  res.json(integrations);
};

export const getIntegration = async (req: AuthRequest, res: Response) => {
  const integration = await Integration.findById(req.params.id);
  if (!integration) throw new AppError('Integration not found', 404, 'NOT_FOUND');
  res.json(integration);
};

export const createIntegration = async (req: AuthRequest, res: Response) => {
  const integration = await Integration.create({
    ...req.body,
    createdBy: req.user?._id
  });
  res.status(201).json(integration);
};

export const updateIntegration = async (req: AuthRequest, res: Response) => {
  const integration = await Integration.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user?._id },
    { new: true, runValidators: true }
  );
  if (!integration) throw new AppError('Integration not found', 404, 'NOT_FOUND');
  res.json(integration);
};

export const syncIntegration = async (req: AuthRequest, res: Response) => {
  const batch = await ImportService.runSync(req.params.id as string, req.user!._id.toString());
  res.json({ message: 'Sync completed', batch });
};
