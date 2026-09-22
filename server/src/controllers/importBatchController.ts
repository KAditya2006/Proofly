import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import ImportBatch from '../models/ImportBatch';
import { AppError } from '../middleware/errorHandler';

export const getImportBatches = async (req: AuthRequest, res: Response) => {
  const filter: any = {};
  if (req.query.integrationId) {
    filter.integrationId = req.query.integrationId;
  }
  
  const batches = await ImportBatch.find(filter)
    .populate('integrationId', 'name')
    .sort({ createdAt: -1 })
    .limit(50);
    
  res.json(batches);
};

export const getImportBatch = async (req: AuthRequest, res: Response) => {
  const batch = await ImportBatch.findById(req.params.id)
    .populate('integrationId', 'name type');
    
  if (!batch) throw new AppError('Import Batch not found', 404, 'NOT_FOUND');
  res.json(batch);
};
