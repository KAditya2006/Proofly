"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryJob = exports.getJobById = exports.getJobs = void 0;
const Job_1 = __importDefault(require("../models/Job"));
const errorHandler_1 = require("../middleware/errorHandler");
const getJobs = async (req, res) => {
    try {
        const jobs = await Job_1.default.find().sort({ createdAt: -1 }).limit(50).populate('createdBy', 'firstName lastName email');
        res.json(jobs);
    }
    catch (error) {
        throw new errorHandler_1.AppError('Failed to fetch jobs', 500, 'FETCH_JOBS_FAILED');
    }
};
exports.getJobs = getJobs;
const getJobById = async (req, res) => {
    try {
        const job = await Job_1.default.findById(req.params.id).populate('createdBy', 'firstName lastName email');
        if (!job) {
            throw new errorHandler_1.AppError('Job not found', 404, 'RESOURCE_NOT_FOUND');
        }
        res.json(job);
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to fetch job', 500, 'FETCH_JOB_FAILED');
    }
};
exports.getJobById = getJobById;
// Retry a failed job (if applicable)
const retryJob = async (req, res) => {
    try {
        const job = await Job_1.default.findById(req.params.id);
        if (!job) {
            throw new errorHandler_1.AppError('Job not found', 404, 'RESOURCE_NOT_FOUND');
        }
        if (job.status !== 'FAILED') {
            throw new errorHandler_1.AppError('Only failed jobs can be retried', 400, 'INVALID_OPERATION');
        }
        // Create a new job based on the old one to maintain history
        const newJob = await Job_1.default.create({
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
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to retry job', 500, 'RETRY_JOB_FAILED');
    }
};
exports.retryJob = retryJob;
