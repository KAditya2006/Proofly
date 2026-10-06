"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitRecord = exports.validateRecordEndpoint = exports.updateRecord = exports.createRecord = exports.getRecordById = exports.getRecords = exports.isAuthorizedForProject = void 0;
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const Project_1 = __importDefault(require("../models/Project"));
const ReportingPeriod_1 = __importDefault(require("../models/ReportingPeriod"));
const ESGIndicator_1 = __importDefault(require("../models/ESGIndicator"));
const validationEngine_1 = require("../utils/validationEngine");
const auditLogger_1 = require("../utils/auditLogger");
const errorHandler_1 = require("../middleware/errorHandler");
const mongoose_1 = __importDefault(require("mongoose"));
const hierarchy_1 = require("../utils/hierarchy");
// Helper to check if a user is authorized for a specific project
const isAuthorizedForProject = async (user, projectId) => {
    if (['ADMIN'].includes(user.role))
        return true;
    const project = await Project_1.default.findById(projectId);
    if (!project)
        return false;
    if (['GROUP_ESG_TEAM', 'AUDITOR'].includes(user.role)) {
        const descendantOrgIds = await (0, hierarchy_1.getDescendantOrgIds)(user.organizationId);
        return descendantOrgIds.some(orgId => orgId.toString() === project.organizationId?.toString() ||
            orgId.toString() === project.subsidiaryId?.toString() ||
            orgId.toString() === project.businessUnitId?.toString());
    }
    if (user.role === 'PROJECT_OFFICER') {
        return project.assignedOfficers?.map(id => id.toString()).includes(user._id.toString()) || false;
    }
    if (user.role === 'BUSINESS_UNIT_REVIEWER') {
        return project.businessUnitId?.toString() === user.organizationId.toString();
    }
    if (user.role === 'SUBSIDIARY_MANAGER') {
        return project.subsidiaryId?.toString() === user.organizationId.toString();
    }
    return false;
};
exports.isAuthorizedForProject = isAuthorizedForProject;
// @desc    Get ESG Records based on role
// @route   GET /api/esg/records
// @access  Private
const getRecords = async (req, res) => {
    try {
        if (!req.user)
            return;
        const { role, _id, organizationId } = req.user;
        let query = {};
        if (role === 'PROJECT_OFFICER') {
            const assignedProjects = await Project_1.default.find({ assignedOfficers: _id }).select('_id');
            query.projectId = { $in: assignedProjects.map(p => p._id) };
        }
        else if (role === 'BUSINESS_UNIT_REVIEWER') {
            const buProjects = await Project_1.default.find({ businessUnitId: organizationId }).select('_id');
            query.projectId = { $in: buProjects.map(p => p._id) };
            // Reviewers only see submitted and beyond
            query.status = { $in: ['SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED', 'REJECTED'] };
        }
        else if (role === 'SUBSIDIARY_MANAGER') {
            const subProjects = await Project_1.default.find({ subsidiaryId: organizationId }).select('_id');
            query.projectId = { $in: subProjects.map(p => p._id) };
            // Managers usually see all states or just submitted
        }
        else if (['GROUP_ESG_TEAM', 'AUDITOR'].includes(role)) {
            const authorizedProjectIds = await (0, hierarchy_1.getAuthorizedProjectIds)(organizationId);
            query.projectId = { $in: authorizedProjectIds };
            if (role === 'AUDITOR') {
                query.status = 'APPROVED';
            }
        }
        if (req.query.indicatorId) {
            query.indicatorId = req.query.indicatorId;
        }
        if (req.query.reportingPeriodId) {
            query.reportingPeriodId = req.query.reportingPeriodId;
        }
        if (req.query.projectId) {
            // Ensure they don't bypass role-based projectId filter
            if (query.projectId && typeof query.projectId === 'object' && '$in' in query.projectId) {
                const allowedIds = query.projectId.$in.map((id) => id.toString());
                if (allowedIds.includes(req.query.projectId)) {
                    query.projectId = req.query.projectId;
                }
                else {
                    res.status(403).json({ message: 'Not authorized for this project' });
                    return;
                }
            }
            else {
                query.projectId = req.query.projectId;
            }
        }
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const total = await ESGRecord_1.default.countDocuments(query);
        const records = await ESGRecord_1.default.find(query)
            .populate('indicatorId')
            .populate('projectId', 'name projectCode')
            .populate('reportingPeriodId', 'name financialYear')
            .populate('evidenceIds', 'name fileUrl')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json({
            data: records,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching ESG records' });
    }
};
exports.getRecords = getRecords;
// @desc    Get record by ID
// @route   GET /api/esg/records/:id
// @access  Private
const getRecordById = async (req, res) => {
    try {
        const record = await ESGRecord_1.default.findById(req.params.id)
            .populate('indicatorId')
            .populate('projectId')
            .populate('reportingPeriodId')
            .populate('evidenceIds')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .populate('submittedBy', 'name email')
            .populate('approvedBy', 'name email');
        if (!record) {
            throw new errorHandler_1.AppError('Record not found', 404, 'NOT_FOUND');
        }
        if (!(await (0, exports.isAuthorizedForProject)(req.user, record.projectId?._id || record.projectId))) {
            throw new errorHandler_1.AppError('Not authorized to access this record', 403, 'FORBIDDEN');
        }
        res.json(record);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching ESG record' });
    }
};
exports.getRecordById = getRecordById;
// @desc    Create draft ESG Record
// @route   POST /api/esg/records
// @access  Private (Officer)
const createRecord = async (req, res) => {
    try {
        if (!req.user)
            return;
        const { projectId, indicatorId, reportingPeriodId, value, unit, source, calculationMethod, remarks, evidenceIds, comments, activityData, activityUnit, emissionFactor, emissionFactorSource, emissionFactorYear, waterWithdrawal, waterDischarge, wasteCategory, wasteDisposalMethod, wasteQuantity } = req.body;
        // We allow value to be undefined if they are submitting GHG/Water/Waste data (we calculate it)
        if (!projectId || !indicatorId || !reportingPeriodId) {
            throw new errorHandler_1.AppError('Missing mandatory fields', 400, 'INVALID_INPUT');
        }
        const project = await Project_1.default.findById(projectId);
        if (!project) {
            throw new errorHandler_1.AppError('Invalid project ID', 400, 'INVALID_INPUT');
        }
        if (!(await (0, exports.isAuthorizedForProject)(req.user, project._id))) {
            throw new errorHandler_1.AppError('Not authorized to create records for this project', 403, 'FORBIDDEN');
        }
        // Verify ReportingPeriod
        const period = await ReportingPeriod_1.default.findById(reportingPeriodId);
        if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
            throw new errorHandler_1.AppError('Reporting period is invalid or closed', 400, 'INVALID_PERIOD');
        }
        // Verify Indicator
        const indicator = await ESGIndicator_1.default.findById(indicatorId);
        if (!indicator || indicator.status !== 'ACTIVE') {
            throw new errorHandler_1.AppError('Indicator is invalid or inactive', 400, 'INVALID_INDICATOR');
        }
        // Duplicate check
        const existingRecord = await ESGRecord_1.default.findOne({
            projectId,
            indicatorId,
            reportingPeriodId
        });
        if (existingRecord) {
            res.status(409).json({ message: 'ESG Record for this indicator and period already exists' });
            return;
        }
        let finalValue = value;
        let finalUnit = unit;
        let finalActivityData = activityData;
        let finalActivityUnit = activityUnit;
        let co2eResult = undefined;
        // GHG Calculation Engine (Must use raw activity data for dimensional consistency with emission factor)
        if (indicator.isGHG || (finalActivityData !== undefined && emissionFactor !== undefined)) {
            if (finalActivityData === undefined || emissionFactor === undefined) {
                throw new errorHandler_1.AppError('Activity data and Emission factor are required for GHG calculations', 400, 'INVALID_INPUT');
            }
            co2eResult = Number(finalActivityData) * Number(emissionFactor);
            finalValue = co2eResult; // Override value with calculated CO2e
            finalUnit = 'tCO2e';
        }
        else {
            // Energy Normalization Engine (Only apply if NOT a GHG calculated indicator)
            const energyConversions = {
                'Joule': 1e-9, 'J': 1e-9,
                'kJ': 1e-6,
                'MJ': 1e-3,
                'GJ': 1,
                'kWh': 0.0036,
                'MWh': 3.6,
                'MMBtu': 1.055056
            };
            if (finalUnit && energyConversions[finalUnit] !== undefined && finalValue !== undefined) {
                finalValue = Number(finalValue) * energyConversions[finalUnit];
                finalUnit = 'GJ';
            }
        }
        // Water Balance Engine
        let finalWaterConsumption = undefined;
        if (indicator.isWater || (waterWithdrawal !== undefined && waterDischarge !== undefined)) {
            if (waterWithdrawal === undefined || waterDischarge === undefined) {
                throw new errorHandler_1.AppError('Water withdrawal and discharge are required for Water indicators', 400, 'INVALID_INPUT');
            }
            if (Number(waterWithdrawal) < Number(waterDischarge)) {
                throw new errorHandler_1.AppError('Water withdrawal cannot be less than discharge', 400, 'INVALID_INPUT');
            }
            finalWaterConsumption = Number(waterWithdrawal) - Number(waterDischarge);
            // Map final value according to the specific BRSR disclosure requirement
            const indName = indicator.name.toLowerCase();
            if (indName.includes('withdrawal')) {
                finalValue = Number(waterWithdrawal);
            }
            else if (indName.includes('discharge')) {
                finalValue = Number(waterDischarge);
            }
            else {
                // Defaults to consumption for "Total Water Consumption"
                finalValue = finalWaterConsumption;
            }
        }
        // Waste Routing Engine
        if (indicator.isWaste || wasteCategory || wasteDisposalMethod || wasteQuantity !== undefined) {
            if (!wasteCategory || !wasteDisposalMethod || wasteQuantity === undefined) {
                throw new errorHandler_1.AppError('Category, Disposal Method, and Quantity are required for Waste indicators', 400, 'INVALID_INPUT');
            }
            if (Number(wasteQuantity) < 0) {
                throw new errorHandler_1.AppError('Waste quantity cannot be negative', 400, 'INVALID_INPUT');
            }
            const validCategories = ['HAZARDOUS', 'NON_HAZARDOUS'];
            if (!validCategories.includes(wasteCategory)) {
                throw new errorHandler_1.AppError(`Invalid waste category. Must be one of: ${validCategories.join(', ')}`, 400, 'INVALID_INPUT');
            }
            const validMethods = ['RECYCLED', 'REUSED', 'RECOVERED', 'DISPOSED', 'LANDFILLED', 'INCINERATED', 'OTHER'];
            if (!validMethods.includes(wasteDisposalMethod)) {
                throw new errorHandler_1.AppError(`Invalid waste disposal method. Must be one of: ${validMethods.join(', ')}`, 400, 'INVALID_INPUT');
            }
            finalValue = Number(wasteQuantity); // Override value with quantity
        }
        if (finalValue === undefined || !unit) {
            throw new errorHandler_1.AppError('Value or Unit is missing', 400, 'INVALID_INPUT');
        }
        const newRecord = new ESGRecord_1.default({
            indicatorId,
            projectId,
            reportingPeriodId,
            value: finalValue,
            unit: finalUnit,
            source,
            calculationMethod,
            remarks,
            evidenceIds,
            comments,
            activityData: finalActivityData,
            activityUnit: finalActivityUnit,
            emissionFactor,
            emissionFactorSource,
            emissionFactorYear,
            co2eResult,
            waterWithdrawal,
            waterDischarge,
            waterConsumption: finalWaterConsumption,
            wasteCategory,
            wasteDisposalMethod,
            wasteQuantity,
            organizationId: project.organizationId,
            status: 'DRAFT',
            createdBy: req.user._id,
            updatedBy: req.user._id
        });
        const savedRecord = await newRecord.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'CREATE_RECORD',
            entityType: 'ESGRecord',
            entityId: savedRecord._id.toString(),
            after: savedRecord.toObject(),
            ipAddress: req.ip
        });
        res.status(201).json(savedRecord);
    }
    catch (error) {
        console.error(error);
        if (error instanceof errorHandler_1.AppError || error.statusCode) {
            res.status(error.statusCode || 400).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Server error creating ESG record' });
        }
    }
};
exports.createRecord = createRecord;
// @desc    Update ESG Record
// @route   PUT /api/esg/records/:id
// @access  Private (Officer)
const updateRecord = async (req, res) => {
    try {
        if (!req.user)
            return;
        const record = await ESGRecord_1.default.findById(req.params.id);
        if (!record) {
            throw new errorHandler_1.AppError('Record not found', 404, 'NOT_FOUND');
        }
        if (!(await (0, exports.isAuthorizedForProject)(req.user, record.projectId?._id || record.projectId))) {
            throw new errorHandler_1.AppError('Not authorized to update this record', 403, 'FORBIDDEN');
        }
        if (!['DRAFT', 'VALIDATION_FAILED', 'CORRECTION_REQUIRED'].includes(record.status)) {
            res.status(400).json({ message: 'Cannot update record in current status' });
            return;
        }
        // Verify ReportingPeriod
        const ReportingPeriod = mongoose_1.default.model('ReportingPeriod');
        const period = await ReportingPeriod.findById(record.reportingPeriodId);
        if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
            throw new errorHandler_1.AppError('Reporting period is closed, cannot update records', 400, 'INVALID_PERIOD');
        }
        const before = record.toObject();
        // Only allow updating safe fields
        const { value, unit, source, calculationMethod, remarks, evidenceIds, comments, activityData, activityUnit, emissionFactor, emissionFactorSource, emissionFactorYear, waterWithdrawal, waterDischarge, wasteCategory, wasteDisposalMethod, wasteQuantity } = req.body;
        // Check if it's a GHG, Water, or Waste calculation
        const indicator = await ESGIndicator_1.default.findById(record.indicatorId);
        let finalValue = value !== undefined ? value : record.value;
        let finalUnit = unit !== undefined ? unit : record.unit;
        let finalActivityData = activityData !== undefined ? activityData : record.activityData;
        let finalActivityUnit = activityUnit !== undefined ? activityUnit : record.activityUnit;
        let newCo2eResult = record.co2eResult;
        if (indicator?.isGHG || finalActivityData !== undefined || emissionFactor !== undefined) {
            const actData = finalActivityData !== undefined ? Number(finalActivityData) : record.activityData;
            const emFactor = emissionFactor !== undefined ? Number(emissionFactor) : record.emissionFactor;
            if (actData !== undefined && emFactor !== undefined) {
                newCo2eResult = actData * emFactor;
                finalValue = newCo2eResult;
                finalUnit = 'tCO2e';
            }
        }
        else {
            // Energy Normalization Engine
            const energyConversions = {
                'Joule': 1e-9, 'J': 1e-9,
                'kJ': 1e-6,
                'MJ': 1e-3,
                'GJ': 1,
                'kWh': 0.0036,
                'MWh': 3.6,
                'MMBtu': 1.055056
            };
            if (finalUnit && energyConversions[finalUnit] !== undefined && finalValue !== undefined) {
                finalValue = Number(finalValue) * energyConversions[finalUnit];
                finalUnit = 'GJ';
            }
        }
        let newWaterConsumption = record.waterConsumption;
        if (indicator?.isWater || waterWithdrawal !== undefined || waterDischarge !== undefined) {
            const wWidth = waterWithdrawal !== undefined ? Number(waterWithdrawal) : record.waterWithdrawal;
            const wDisch = waterDischarge !== undefined ? Number(waterDischarge) : record.waterDischarge;
            if (wWidth !== undefined && wDisch !== undefined) {
                if (wWidth < wDisch) {
                    throw new errorHandler_1.AppError('Water withdrawal cannot be less than discharge', 400, 'INVALID_INPUT');
                }
                newWaterConsumption = wWidth - wDisch;
                const indName = indicator?.name?.toLowerCase() || '';
                if (indName.includes('withdrawal')) {
                    finalValue = wWidth;
                }
                else if (indName.includes('discharge')) {
                    finalValue = wDisch;
                }
                else {
                    finalValue = newWaterConsumption;
                }
            }
        }
        if (indicator?.isWaste || wasteQuantity !== undefined || wasteCategory || wasteDisposalMethod) {
            const wQty = wasteQuantity !== undefined ? Number(wasteQuantity) : record.wasteQuantity;
            const wCat = wasteCategory !== undefined ? wasteCategory : record.wasteCategory;
            const wMeth = wasteDisposalMethod !== undefined ? wasteDisposalMethod : record.wasteDisposalMethod;
            if (wQty !== undefined) {
                if (wQty < 0) {
                    throw new errorHandler_1.AppError('Waste quantity cannot be negative', 400, 'INVALID_INPUT');
                }
                finalValue = wQty;
            }
            if (wCat && !['HAZARDOUS', 'NON_HAZARDOUS'].includes(wCat)) {
                throw new errorHandler_1.AppError('Invalid waste category', 400, 'INVALID_INPUT');
            }
            if (wMeth && !['RECYCLED', 'REUSED', 'RECOVERED', 'DISPOSED', 'LANDFILLED', 'INCINERATED', 'OTHER'].includes(wMeth)) {
                throw new errorHandler_1.AppError('Invalid waste disposal method', 400, 'INVALID_INPUT');
            }
        }
        if (finalValue !== undefined)
            record.value = finalValue;
        if (finalUnit !== undefined)
            record.unit = finalUnit;
        if (source !== undefined)
            record.source = source;
        if (calculationMethod !== undefined)
            record.calculationMethod = calculationMethod;
        if (remarks !== undefined)
            record.remarks = remarks;
        if (evidenceIds !== undefined)
            record.evidenceIds = evidenceIds;
        if (comments !== undefined)
            record.comments = comments;
        if (finalActivityData !== undefined)
            record.activityData = finalActivityData;
        if (finalActivityUnit !== undefined)
            record.activityUnit = finalActivityUnit;
        if (emissionFactor !== undefined)
            record.emissionFactor = emissionFactor;
        if (emissionFactorSource !== undefined)
            record.emissionFactorSource = emissionFactorSource;
        if (emissionFactorYear !== undefined)
            record.emissionFactorYear = emissionFactorYear;
        if (newCo2eResult !== undefined)
            record.co2eResult = newCo2eResult;
        if (waterWithdrawal !== undefined)
            record.waterWithdrawal = waterWithdrawal;
        if (waterDischarge !== undefined)
            record.waterDischarge = waterDischarge;
        if (newWaterConsumption !== undefined)
            record.waterConsumption = newWaterConsumption;
        if (wasteCategory !== undefined)
            record.wasteCategory = wasteCategory;
        if (wasteDisposalMethod !== undefined)
            record.wasteDisposalMethod = wasteDisposalMethod;
        if (wasteQuantity !== undefined)
            record.wasteQuantity = wasteQuantity;
        record.updatedBy = req.user._id;
        // If it was correction required or validation failed, moving it back to draft phase
        if (record.status === 'CORRECTION_REQUIRED' || record.status === 'VALIDATION_FAILED') {
            record.status = 'DRAFT';
        }
        const savedRecord = await record.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'UPDATE_RECORD',
            entityType: 'ESGRecord',
            entityId: savedRecord._id.toString(),
            before: before,
            after: savedRecord.toObject(),
            ipAddress: req.ip
        });
        res.json(savedRecord);
    }
    catch (error) {
        console.error(error);
        if (error instanceof errorHandler_1.AppError || error.statusCode) {
            res.status(error.statusCode || 400).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Server error updating ESG record' });
        }
    }
};
exports.updateRecord = updateRecord;
// @desc    Validate ESG Record
// @route   POST /api/esg/records/:id/validate
// @access  Private
const validateRecordEndpoint = async (req, res) => {
    try {
        if (!req.user)
            return;
        const record = await ESGRecord_1.default.findById(req.params.id);
        if (!record) {
            throw new errorHandler_1.AppError('Record not found', 404, 'NOT_FOUND');
        }
        if (!(await (0, exports.isAuthorizedForProject)(req.user, record.projectId?._id || record.projectId))) {
            throw new errorHandler_1.AppError('Not authorized to validate this record', 403, 'FORBIDDEN');
        }
        const validation = await (0, validationEngine_1.validateRecord)(record);
        record.status = validation.isValid ? 'DRAFT' : 'VALIDATION_FAILED';
        record.updatedBy = req.user._id;
        await record.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: validation.isValid ? 'VALIDATION_PASSED' : 'VALIDATION_FAILED',
            entityType: 'ESGRecord',
            entityId: record._id,
            after: { isValid: validation.isValid, errors: validation.errors },
            ipAddress: req.ip
        });
        res.json({ record, validation });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error validating ESG record' });
    }
};
exports.validateRecordEndpoint = validateRecordEndpoint;
// @desc    Submit ESG Record
// @route   POST /api/esg/records/:id/submit
// @access  Private (Officer)
const submitRecord = async (req, res) => {
    try {
        if (!req.user)
            return;
        const record = await ESGRecord_1.default.findById(req.params.id).populate('indicatorId');
        if (!record) {
            throw new errorHandler_1.AppError('Record not found', 404, 'NOT_FOUND');
        }
        if (!(await (0, exports.isAuthorizedForProject)(req.user, record.projectId?._id || record.projectId))) {
            throw new errorHandler_1.AppError('Not authorized to submit this record', 403, 'FORBIDDEN');
        }
        if (record.status !== 'DRAFT') {
            res.status(400).json({ message: 'Record must be a DRAFT before submission. (Please validate again if validation failed)' });
            return;
        }
        // Verify ReportingPeriod
        const ReportingPeriod = mongoose_1.default.model('ReportingPeriod');
        const period = await ReportingPeriod.findById(record.reportingPeriodId);
        console.log('Submit Record Period Debug:', record.reportingPeriodId, period);
        if (!period || period.status === 'CLOSED' || period.status === 'ARCHIVED') {
            throw new errorHandler_1.AppError('Reporting period is closed, cannot submit records', 400, 'INVALID_PERIOD');
        }
        // Run validation Engine before submitting
        const validation = await (0, validationEngine_1.validateRecord)(record);
        if (!validation.isValid) {
            record.status = 'VALIDATION_FAILED';
            record.updatedBy = req.user._id;
            await record.save();
            await (0, auditLogger_1.logAudit)({
                userId: req.user._id,
                action: 'VALIDATION_FAILED_ON_SUBMIT',
                entityType: 'ESGRecord',
                entityId: record._id,
                after: { errors: validation.errors },
                ipAddress: req.ip
            });
            res.status(400).json({
                message: 'Validation failed, cannot submit.',
                errors: validation.errors
            });
            return;
        }
        record.status = 'SUBMITTED';
        record.submittedBy = req.user._id;
        record.submittedAt = new Date();
        record.updatedBy = req.user._id;
        await record.save();
        await (0, auditLogger_1.logAudit)({
            userId: req.user._id,
            action: 'SUBMIT_RECORD',
            entityType: 'ESGRecord',
            entityId: record._id,
            ipAddress: req.ip
        });
        res.json(record);
    }
    catch (error) {
        console.error(error);
        if (error instanceof errorHandler_1.AppError || error.statusCode) {
            res.status(error.statusCode || 400).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Server error submitting ESG record' });
        }
    }
};
exports.submitRecord = submitRecord;
