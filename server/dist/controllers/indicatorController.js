"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIndicator = exports.createIndicator = exports.getIndicatorById = exports.getIndicators = void 0;
const ESGIndicator_1 = __importDefault(require("../models/ESGIndicator"));
// @desc    Get all indicators
// @route   GET /api/indicators
// @access  Private
const getIndicators = async (req, res) => {
    try {
        const indicators = await ESGIndicator_1.default.find().sort({ category: 1, subcategory: 1 });
        res.json(indicators);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching indicators' });
    }
};
exports.getIndicators = getIndicators;
// @desc    Get indicator by ID
// @route   GET /api/indicators/:id
// @access  Private
const getIndicatorById = async (req, res) => {
    try {
        const indicator = await ESGIndicator_1.default.findById(req.params.id);
        if (!indicator) {
            return res.status(404).json({ message: 'Indicator not found' });
        }
        res.json(indicator);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching indicator' });
    }
};
exports.getIndicatorById = getIndicatorById;
// @desc    Create indicator
// @route   POST /api/indicators
// @access  Private/Admin
const createIndicator = async (req, res) => {
    try {
        const { code, name, category, unit, dataType, subcategory, description, options, frequency, aggregationMethod, mandatory, validationRules, brsrMappings, status } = req.body;
        if (!code || !name || !category || !unit || !dataType) {
            return res.status(400).json({ message: 'Missing required fields', error: { code: 'BAD_REQUEST' } });
        }
        const existing = await ESGIndicator_1.default.findOne({ code });
        if (existing) {
            return res.status(400).json({ message: 'Indicator code already exists', error: { code: 'DUPLICATE_CODE' } });
        }
        const indicator = await ESGIndicator_1.default.create({
            code, name, category, unit, dataType, subcategory, description, options, frequency, aggregationMethod, mandatory, validationRules, brsrMappings, status
        });
        const { logAudit } = require('../utils/auditLogger');
        await logAudit({
            userId: req.user._id,
            action: 'INDICATOR_CREATED',
            entityType: 'ESGIndicator',
            entityId: indicator._id.toString(),
            after: { code, name, category, dataType }
        });
        res.status(201).json({ success: true, data: indicator });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating indicator' });
    }
};
exports.createIndicator = createIndicator;
// @desc    Update indicator
// @route   PUT /api/indicators/:id
// @access  Private/Admin
const updateIndicator = async (req, res) => {
    try {
        const indicator = await ESGIndicator_1.default.findById(req.params.id);
        if (!indicator) {
            return res.status(404).json({ message: 'Indicator not found', error: { code: 'NOT_FOUND' } });
        }
        const { code, name, category, unit, dataType, subcategory, description, options, frequency, aggregationMethod, mandatory, validationRules, brsrMappings, status } = req.body;
        const beforeState = { code: indicator.code, name: indicator.name, status: indicator.status };
        if (code && code !== indicator.code) {
            const existing = await ESGIndicator_1.default.findOne({ code });
            if (existing) {
                return res.status(400).json({ message: 'Indicator code already exists', error: { code: 'DUPLICATE_CODE' } });
            }
            indicator.code = code;
        }
        if (name)
            indicator.name = name;
        if (category)
            indicator.category = category;
        if (unit)
            indicator.unit = unit;
        if (dataType)
            indicator.dataType = dataType;
        if (subcategory !== undefined)
            indicator.subcategory = subcategory;
        if (description !== undefined)
            indicator.description = description;
        if (options)
            indicator.options = options;
        if (frequency)
            indicator.frequency = frequency;
        if (aggregationMethod)
            indicator.aggregationMethod = aggregationMethod;
        if (mandatory !== undefined)
            indicator.mandatory = mandatory;
        if (validationRules)
            indicator.validationRules = validationRules;
        if (brsrMappings)
            indicator.brsrMappings = brsrMappings;
        if (status) {
            if (!['ACTIVE', 'INACTIVE'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status', error: { code: 'INVALID_STATUS' } });
            }
            indicator.status = status;
        }
        await indicator.save();
        const { logAudit } = require('../utils/auditLogger');
        await logAudit({
            userId: req.user._id,
            action: 'INDICATOR_UPDATED',
            entityType: 'ESGIndicator',
            entityId: indicator._id.toString(),
            before: beforeState,
            after: { code: indicator.code, name: indicator.name, status: indicator.status }
        });
        res.json({ success: true, data: indicator });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating indicator' });
    }
};
exports.updateIndicator = updateIndicator;
