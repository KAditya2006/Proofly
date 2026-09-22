"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncIntegration = exports.updateIntegration = exports.createIntegration = exports.getIntegration = exports.getIntegrations = void 0;
const Integration_1 = __importDefault(require("../models/Integration"));
const errorHandler_1 = require("../middleware/errorHandler");
const importService_1 = require("../services/importService");
const getIntegrations = async (req, res) => {
    const integrations = await Integration_1.default.find().sort({ createdAt: -1 });
    res.json(integrations);
};
exports.getIntegrations = getIntegrations;
const getIntegration = async (req, res) => {
    const integration = await Integration_1.default.findById(req.params.id);
    if (!integration)
        throw new errorHandler_1.AppError('Integration not found', 404, 'NOT_FOUND');
    res.json(integration);
};
exports.getIntegration = getIntegration;
const createIntegration = async (req, res) => {
    const integration = await Integration_1.default.create({
        ...req.body,
        createdBy: req.user?._id
    });
    res.status(201).json(integration);
};
exports.createIntegration = createIntegration;
const updateIntegration = async (req, res) => {
    const integration = await Integration_1.default.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user?._id }, { new: true, runValidators: true });
    if (!integration)
        throw new errorHandler_1.AppError('Integration not found', 404, 'NOT_FOUND');
    res.json(integration);
};
exports.updateIntegration = updateIntegration;
const syncIntegration = async (req, res) => {
    const batch = await importService_1.ImportService.runSync(req.params.id, req.user._id.toString());
    res.json({ message: 'Sync completed', batch });
};
exports.syncIntegration = syncIntegration;
