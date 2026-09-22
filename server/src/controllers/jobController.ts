import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Job from '../models/Job';
import { AppError } from '../middleware/errorHandler';

export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).limit(50).populate('createdBy', 'firstName lastName email');
    res.json(jobs);
  } catch (error) {
    throw new AppError('Failed to fetch jobs', 500, 'FETCH_JOBS_FAILED');
  }
};

export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'firstName lastName email');
    if (!job) {
      throw new AppError('Job not found', 404, 'RESOURCE_NOT_FOUND');
    }
    res.json(job);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch job', 500, 'FETCH_JOB_FAILED');
  }
};

// Retry a failed job (if applicable)
export const retryJob = async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      throw new AppError('Job not found', 404, 'RESOURCE_NOT_FOUND');
    }
    
    if (job.status !== 'FAILED') {
      throw new AppError('Only failed jobs can be retried', 400, 'INVALID_OPERATION');
    }
    
    // Create a new job based on the old one to maintain history
    const newJob = await Job.create({
      type: job.type,
      status: 'QUEUED',
      progress: 0,
      createdBy: req.user?._id,
      metadata: job.metadata
    });
    
    // In a real system, you would push to a queue (e.g. RabbitMQ, Redis) here
    // For this implementation, we would just trigger the respective function based on type
    // Currently, report exports is the only async job, so let's mock the start
    if (job.type === 'REPORT_EXPORT') {
       // Ideally we import the runExport job here
       // runExportTask(newJob._id, ...);
    }

    res.json({ message: 'Job queued for retry', job: newJob });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to retry job', 500, 'RETRY_JOB_FAILED');
  }
};
