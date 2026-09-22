"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImportBatch = exports.getImportBatches = void 0;
const ImportBatch_1 = __importDefault(require("../models/ImportBatch"));
const errorHandler_1 = require("../middleware/errorHandler");
const getImportBatches = async (req, res) => {
    const filter = {};
    if (req.query.integrationId) {
        filter.integrationId = req.query.integrationId;
    }
    const batches = await ImportBatch_1.default.find(filter)
        .populate('integrationId', 'name')
        .sort({ createdAt: -1 })
        .limit(50);
    res.json(batches);
};
exports.getImportBatches = getImportBatches;
const getImportBatch = async (req, res) => {
    const batch = await ImportBatch_1.default.findById(req.params.id)
        .populate('integrationId', 'name type');
    if (!batch)
        throw new errorHandler_1.AppError('Import Batch not found', 404, 'NOT_FOUND');
    res.json(batch);
};
exports.getImportBatch = getImportBatch;
