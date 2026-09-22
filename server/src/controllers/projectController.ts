import { Request as ExpressReq, Response as ExpressRes } from 'express';
import Project from '../models/Project';
import mongoose from 'mongoose';
import { AppError } from '../middleware/errorHandler';

// @desc    Get all projects (with RBAC & Pagination)
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req: any, res: ExpressRes) => {
  try {
    const { role, _id, organizationId } = req.user;
    
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    // RBAC logic for Project visibility
    if (role === 'PROJECT_OFFICER') {
      // Officers only see projects assigned to them
      query.assignedOfficers = _id;
    } else if (role === 'BUSINESS_UNIT_REVIEWER') {
      // Reviewers see projects in their BU
      query.businessUnitId = organizationId;
    } else if (role === 'SUBSIDIARY_MANAGER') {
      // Subsidiary managers see projects in their Subsidiary
      query.subsidiaryId = organizationId;
    } else {
      // GROUP_ESG_TEAM, AUDITOR, ADMIN see all projects
    }
    
    // Populate organization names for the frontend
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req: any, res: ExpressRes) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('organizationId', 'name')
      .populate('businessUnitId', 'name')
      .populate('subsidiaryId', 'name')
      .populate('assignedOfficers', 'name email');
      
    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }
    
    // Check if the user is authorized to view this specific project based on their role
    const { role, _id, organizationId } = req.user;
    let isAuthorized = false;

    if (['ADMIN', 'GROUP_ESG_TEAM', 'AUDITOR'].includes(role)) {
      isAuthorized = true;
    } else if (role === 'PROJECT_OFFICER') {
      isAuthorized = project.assignedOfficers?.map((o: any) => o._id.toString()).includes(_id.toString()) || false;
    } else if (role === 'BUSINESS_UNIT_REVIEWER') {
      isAuthorized = project.businessUnitId?._id?.toString() === organizationId.toString() || project.businessUnitId?.toString() === organizationId.toString();
    } else if (role === 'SUBSIDIARY_MANAGER') {
      isAuthorized = project.subsidiaryId?._id?.toString() === organizationId.toString() || project.subsidiaryId?.toString() === organizationId.toString();
    }

    if (!isAuthorized) {
      throw new AppError('Not authorized to access this project', 403, 'FORBIDDEN');
    }
    
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching project' });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
export const createProject = async (req: any, res: ExpressRes) => {
  try {
    const { 
      name, 
      projectCode, 
      organizationId, 
      businessUnitId, 
      subsidiaryId, 
      location, 
      sector,
      startDate,
      endDate
    } = req.body;

    if (!name || !projectCode || !organizationId || !location || !sector) {
      throw new AppError('Missing required fields', 400, 'BAD_REQUEST');
    }

    const existing = await Project.findOne({ projectCode });
    if (existing) {
      throw new AppError('Project code already exists', 400, 'DUPLICATE_CODE');
    }

    // Verify organization validity
    const org = await mongoose.model('Organization').findById(organizationId);
    if (!org) {
      throw new AppError('Organization not found', 404, 'ORG_NOT_FOUND');
    }

    const project = await Project.create({
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
      assignedOfficers: []
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
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error(error);
    res.status(500).json({ message: 'Server error creating project' });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
export const updateProject = async (req: any, res: ExpressRes) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }

    const { name, projectCode, location, sector, status, assignedOfficers } = req.body;
    
    const beforeState = { 
      name: project.name, 
      projectCode: project.projectCode, 
      location: project.location, 
      status: project.status 
    };

    if (name) project.name = name;
    if (location) project.location = location;
    if (sector) project.sector = sector;
    
    if (status) {
      if (!['ACTIVE', 'COMPLETED', 'ON_HOLD'].includes(status)) {
        throw new AppError('Invalid status', 400, 'INVALID_STATUS');
      }
      project.status = status;
    }

    if (projectCode && projectCode !== project.projectCode) {
      const existing = await Project.findOne({ projectCode });
      if (existing) {
        throw new AppError('Project code already exists', 400, 'DUPLICATE_CODE');
      }
      project.projectCode = projectCode;
    }

    if (assignedOfficers && Array.isArray(assignedOfficers)) {
      const newOfficers = assignedOfficers.map((id: string) => new mongoose.Types.ObjectId(id));

      // 1. Max 1 active project per PO check
      for (const officerId of newOfficers) {
        const otherActiveProject = await Project.findOne({
          _id: { $ne: project._id },
          status: 'ACTIVE',
          assignedOfficers: officerId
        });
        
        if (otherActiveProject) {
          throw new AppError(`Project Officer with ID ${officerId} is already assigned to active project: ${otherActiveProject.name}. They cannot be assigned to another active project.`, 400, 'PO_LIMIT_EXCEEDED');
        }
      }

      // 2. Max 10 POs per BU check
      const businessUnitId = project.businessUnitId;
      if (businessUnitId) {
        // Find all other active projects in this BU
        const otherProjectsInBU = await Project.find({
          _id: { $ne: project._id },
          businessUnitId,
          status: 'ACTIVE'
        });

        const buOfficerIds = new Set<string>();
        for (const p of otherProjectsInBU) {
          if (p.assignedOfficers) {
            for (const oId of p.assignedOfficers) {
              buOfficerIds.add(oId.toString());
            }
          }
        }
        
        for (const oId of newOfficers) {
          buOfficerIds.add(oId.toString());
        }

        if (buOfficerIds.size > 10) {
          throw new AppError(`A Business Unit can have a maximum of 10 Project Officers across all its active projects. Assigning these officers would result in ${buOfficerIds.size} officers for this BU.`, 400, 'BU_PO_LIMIT_EXCEEDED');
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
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error(error);
    res.status(500).json({ message: 'Server error updating project' });
  }
};

// @desc    Delete (Disable) project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
export const deleteProject = async (req: any, res: ExpressRes) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }

    // Checking for ESG records tied to this project
    const ESGRecord = mongoose.model('ESGRecord');
    if (ESGRecord) {
      const recordsCount = await ESGRecord.countDocuments({ projectId: project._id });
      if (recordsCount > 0) {
        throw new AppError(`Cannot delete project. It has ${recordsCount} associated ESG records.`, 400, 'HAS_DEPENDENCIES');
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
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error(error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
};
