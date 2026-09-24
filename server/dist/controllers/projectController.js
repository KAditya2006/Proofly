"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjectById = exports.getProjects = void 0;
const Project_1 = __importDefault(require("../models/Project"));
const mongoose_1 = __importDefault(require("mongoose"));
const errorHandler_1 = require("../middleware/errorHandler");
// @desc    Get all projects (with RBAC & Pagination)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const { role, _id, organizationId } = req.user;
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        let query = {};
        // RBAC logic for Project visibility
        if (role === 'PROJECT_OFFICER') {
            // Officers only see projects assigned to them
            query.assignedOfficers = _id;
        }
        else if (role === 'BUSINESS_UNIT_REVIEWER') {
            // Reviewers see projects in their BU
            query.businessUnitId = organizationId;
        }
        else if (role === 'SUBSIDIARY_MANAGER') {
            // Subsidiary managers see projects in their Subsidiary
            query.subsidiaryId = organizationId;
        }
        else {
            // GROUP_ESG_TEAM, AUDITOR, ADMIN see all projects
        }
        // Populate organization names for the frontend
        const total = await Project_1.default.countDocuments(query);
        const projects = await Project_1.default.find(query)
            .populate('organizationId', 'name')
            .populate('businessUnitId', 'name')
            .populate('subsidiaryId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json({
            data: projects,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching projects' });
    }
};
exports.getProjects = getProjects;
// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
    try {
        const project = await Project_1.default.findById(req.params.id)
            .populate('organizationId', 'name')
            .populate('businessUnitId', 'name')
            .populate('subsidiaryId', 'name')
            .populate('assignedOfficers', 'name email');
        if (!project) {
            throw new errorHandler_1.AppError('Project not found', 404, 'NOT_FOUND');
        }
        // Check if the user is authorized to view this specific project based on their role
        const { role, _id, organizationId } = req.user;
        let isAuthorized = false;
        if (['ADMIN', 'GROUP_ESG_TEAM', 'AUDITOR'].includes(role)) {
            isAuthorized = true;
        }
        else if (role === 'PROJECT_OFFICER') {
            isAuthorized = project.assignedOfficers?.map((o) => o._id.toString()).includes(_id.toString()) || false;
        }
        else if (role === 'BUSINESS_UNIT_REVIEWER') {
            isAuthorized = project.businessUnitId?._id?.toString() === organizationId.toString() || project.businessUnitId?.toString() === organizationId.toString();
        }
        else if (role === 'SUBSIDIARY_MANAGER') {
            isAuthorized = project.subsidiaryId?._id?.toString() === organizationId.toString() || project.subsidiaryId?.toString() === organizationId.toString();
        }
        if (!isAuthorized) {
            throw new errorHandler_1.AppError('Not authorized to access this project', 403, 'FORBIDDEN');
        }
        res.json(project);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching project' });
    }
};
exports.getProjectById = getProjectById;
// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res) => {
    try {
        const { name, organizationId, businessUnitId, subsidiaryId, location, sector, startDate, endDate, assignedOfficers } = req.body;
        if (!name || !organizationId || !location || !sector) {
            throw new errorHandler_1.AppError('Missing required fields', 400, 'BAD_REQUEST');
        }
        // Auto-generate project code sequentially (e.g., PRJ-0001)
        const lastProject = await Project_1.default.findOne().sort({ createdAt: -1 });
        let nextNum = 1;
        if (lastProject && lastProject.projectCode && lastProject.projectCode.startsWith('PRJ-')) {
            const parts = lastProject.projectCode.split('-');
            if (parts.length === 2 && !isNaN(Number(parts[1]))) {
                nextNum = parseInt(parts[1]) + 1;
            }
            else {
                const total = await Project_1.default.countDocuments();
                nextNum = total + 1;
            }
        }
        else if (lastProject) {
            const total = await Project_1.default.countDocuments();
            nextNum = total + 1;
        }
        const projectCode = `PRJ-${nextNum.toString().padStart(4, '0')}`;
        // Verify organization validity
        const org = await mongoose_1.default.model('Organization').findById(organizationId);
        if (!org) {
            throw new errorHandler_1.AppError('Organization not found', 404, 'ORG_NOT_FOUND');
        }
        // 1. Max 1 active project per PO check
        if (assignedOfficers && assignedOfficers.length > 0) {
            for (const officerId of assignedOfficers) {
                const otherActiveProject = await Project_1.default.findOne({
                    status: 'ACTIVE',
                    assignedOfficers: officerId
                });
                if (otherActiveProject) {
                    throw new errorHandler_1.AppError(`Project Officer is already assigned to an active project: ${otherActiveProject.name}.`, 400, 'PO_LIMIT_EXCEEDED');
                }
            }
            // 2. Max 10 POs per BU check
            const otherProjectsInOrg = await Project_1.default.find({
                organizationId,
                status: 'ACTIVE'
            });
            const orgOfficerIds = new Set();
            for (const p of otherProjectsInOrg) {
                if (p.assignedOfficers) {
                    for (const oId of p.assignedOfficers) {
                        orgOfficerIds.add(oId.toString());
                    }
                }
            }
            for (const oId of assignedOfficers) {
                orgOfficerIds.add(oId.toString());
            }
            if (orgOfficerIds.size > 10) {
                throw new errorHandler_1.AppError(`This Business Unit can have a maximum of 10 Project Officers across all its active projects. Assigning these would exceed the limit.`, 400, 'BU_PO_LIMIT_EXCEEDED');
            }
        }
        const project = await Project_1.default.create({
            name,
            projectCode,
            organizationId,
            businessUnitId: businessUnitId || null,
            subsidiaryId: subsidiaryId || null,
            location,
            sector,
            startDate,
            endDate,
            status: 'ACTIVE',
            assignedOfficers: assignedOfficers ? assignedOfficers.map((id) => new mongoose_1.default.Types.ObjectId(id)) : []
        });
        const { logAudit } = require('../utils/auditLogger');
        await logAudit({
            userId: req.user._id,
            action: 'PROJECT_CREATED',
            entityType: 'Project',
            entityId: project._id.toString(),
            after: { name, projectCode, organizationId, businessUnitId, subsidiaryId }
        });
        res.status(201).json({ success: true, data: project });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        console.error(error);
        res.status(500).json({ message: 'Server error creating project' });
    }
};
exports.createProject = createProject;
// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
const updateProject = async (req, res) => {
    try {
        const project = await Project_1.default.findById(req.params.id);
        if (!project) {
            throw new errorHandler_1.AppError('Project not found', 404, 'NOT_FOUND');
        }
        const { name, projectCode, location, sector, status, assignedOfficers } = req.body;
        const beforeState = {
            name: project.name,
            projectCode: project.projectCode,
            location: project.location,
            status: project.status
        };
        if (name)
            project.name = name;
        if (location)
            project.location = location;
        if (sector)
            project.sector = sector;
        if (status) {
            if (!['ACTIVE', 'COMPLETED', 'ON_HOLD'].includes(status)) {
                throw new errorHandler_1.AppError('Invalid status', 400, 'INVALID_STATUS');
            }
            project.status = status;
        }
        if (projectCode && projectCode !== project.projectCode) {
            const existing = await Project_1.default.findOne({ projectCode });
            if (existing) {
                throw new errorHandler_1.AppError('Project code already exists', 400, 'DUPLICATE_CODE');
            }
            project.projectCode = projectCode;
        }
        if (assignedOfficers && Array.isArray(assignedOfficers)) {
            const newOfficers = assignedOfficers.map((id) => new mongoose_1.default.Types.ObjectId(id));
            // 1. Max 1 active project per PO check
            for (const officerId of newOfficers) {
                const otherActiveProject = await Project_1.default.findOne({
                    _id: { $ne: project._id },
                    status: 'ACTIVE',
                    assignedOfficers: officerId
                });
                if (otherActiveProject) {
                    throw new errorHandler_1.AppError(`Project Officer is already assigned to active project: ${otherActiveProject.name}.`, 400, 'PO_LIMIT_EXCEEDED');
                }
            }
            // 2. Max 10 POs per BU check
            const orgId = project.organizationId;
            if (orgId) {
                // Find all other active projects in this BU
                const otherProjectsInOrg = await Project_1.default.find({
                    _id: { $ne: project._id },
                    organizationId: orgId,
                    status: 'ACTIVE'
                });
                const orgOfficerIds = new Set();
                for (const p of otherProjectsInOrg) {
                    if (p.assignedOfficers) {
                        for (const oId of p.assignedOfficers) {
                            orgOfficerIds.add(oId.toString());
                        }
                    }
                }
                for (const oId of newOfficers) {
                    orgOfficerIds.add(oId.toString());
                }
                if (orgOfficerIds.size > 10) {
                    throw new errorHandler_1.AppError(`A Business Unit can have a maximum of 10 Project Officers across all its active projects. Assigning these officers would result in ${orgOfficerIds.size} officers for this BU.`, 400, 'BU_PO_LIMIT_EXCEEDED');
                }
            }
            project.assignedOfficers = newOfficers;
        }
        await project.save();
        const { logAudit } = require('../utils/auditLogger');
        await logAudit({
            userId: req.user._id,
            action: 'PROJECT_UPDATED',
            entityType: 'Project',
            entityId: project._id.toString(),
            before: beforeState,
            after: { name: project.name, projectCode: project.projectCode, location: project.location, status: project.status }
        });
        res.json({ success: true, data: project });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        console.error(error);
        res.status(500).json({ message: 'Server error updating project' });
    }
};
exports.updateProject = updateProject;
// @desc    Delete (Disable) project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
    try {
        const project = await Project_1.default.findById(req.params.id);
        if (!project) {
            throw new errorHandler_1.AppError('Project not found', 404, 'NOT_FOUND');
        }
        // Checking for ESG records tied to this project
        const ESGRecord = mongoose_1.default.model('ESGRecord');
        if (ESGRecord) {
            const recordsCount = await ESGRecord.countDocuments({ projectId: project._id });
            if (recordsCount > 0) {
                throw new errorHandler_1.AppError(`Cannot delete project. It has ${recordsCount} associated ESG records.`, 400, 'HAS_DEPENDENCIES');
            }
        }
        project.status = 'ON_HOLD'; // We use ON_HOLD instead of INACTIVE for projects as a soft-delete/deactivate
        await project.save();
        const { logAudit } = require('../utils/auditLogger');
        await logAudit({
            userId: req.user._id,
            action: 'PROJECT_DELETED',
            entityType: 'Project',
            entityId: project._id.toString(),
            before: { status: 'ACTIVE' },
            after: { status: 'ON_HOLD' }
        });
        res.json({ success: true, message: 'Project placed on ON_HOLD status' });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        console.error(error);
        res.status(500).json({ message: 'Server error deleting project' });
    }
};
exports.deleteProject = deleteProject;
