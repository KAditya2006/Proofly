import { Request as ExpressReq, Response as ExpressRes } from 'express';
import Organization from '../models/Organization';

// @desc    Get all organizations
// @route   GET /api/organizations
// @access  Private
export const getOrganizations = async (req: any, res: ExpressRes) => {
  try {
    // For MVP, just return all organizations. 
    // They are public knowledge within the enterprise for mapping purposes.
    const organizations = await Organization.find({ type: { $in: ['GROUP', 'SUBSIDIARY', 'BUSINESS_UNIT'] } }).sort({ createdAt: 1 });
    res.json(organizations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching organizations' });
  }
};

// @desc    Get organization by ID
// @route   GET /api/organizations/:id
// @access  Private
export const getOrganizationById = async (req: any, res: ExpressRes) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(org);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching organization' });
  }
};

// @desc    Create organization
// @route   POST /api/organizations
// @access  Private/Admin
export const createOrganization = async (req: any, res: ExpressRes) => {
  try {
    const { name, type, parentId, code, location } = req.body;

    if (!name || !type || !code) {
      return res.status(400).json({ message: 'Name, type, and code are required', error: { code: 'BAD_REQUEST' } });
    }

    const validTypes = ['GROUP', 'SUBSIDIARY', 'BUSINESS_UNIT'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid organization type', error: { code: 'INVALID_TYPE' } });
    }

    const existingCode = await Organization.findOne({ code });
    if (existingCode) {
      return res.status(400).json({ message: 'Organization code already exists', error: { code: 'DUPLICATE_CODE' } });
    }

    if (parentId) {
      const parentOrg = await Organization.findById(parentId);
      if (!parentOrg) {
        return res.status(404).json({ message: 'Parent organization not found', error: { code: 'PARENT_NOT_FOUND' } });
      }

      // Hierarchy rules
      if (type === 'GROUP' && parentId) {
        return res.status(400).json({ message: 'GROUP cannot have a parent', error: { code: 'INVALID_HIERARCHY' } });
      }
      if (type === 'SUBSIDIARY' && parentOrg.type !== 'GROUP') {
        return res.status(400).json({ message: 'SUBSIDIARY must report to GROUP', error: { code: 'INVALID_HIERARCHY' } });
      }
      if (type === 'BUSINESS_UNIT' && parentOrg.type !== 'SUBSIDIARY') {
        return res.status(400).json({ message: 'BUSINESS_UNIT must report to SUBSIDIARY', error: { code: 'INVALID_HIERARCHY' } });
      }
    } else if (type !== 'GROUP') {
      return res.status(400).json({ message: 'Only GROUP can have no parent', error: { code: 'INVALID_HIERARCHY' } });
    }

    const org = await Organization.create({
      name,
      type,
      parentId: parentId || undefined,
      code,
      location,
      status: 'ACTIVE'
    });

    const { logAudit } = require('../utils/auditLogger');
    await logAudit({
      userId: req.user._id,
      action: 'ORGANIZATION_CREATED',
      entityType: 'Organization',
      entityId: org._id.toString(),
      after: { name, type, code }
    });

    res.status(201).json({ success: true, data: org });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating organization' });
  }
};

// @desc    Update organization
// @route   PUT /api/organizations/:id
// @access  Private/Admin
export const updateOrganization = async (req: any, res: ExpressRes) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found', error: { code: 'NOT_FOUND' } });
    }

    const { name, code, location, status } = req.body;
    const beforeState = { name: org.name, code: org.code, location: org.location, status: org.status };

    if (name) org.name = name;
    if (location !== undefined) org.location = location;
    if (status) {
      if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status', error: { code: 'INVALID_STATUS' } });
      }
      org.status = status;
    }
    
    if (code && code !== org.code) {
      const existingCode = await Organization.findOne({ code });
      if (existingCode) {
        return res.status(400).json({ message: 'Organization code already exists', error: { code: 'DUPLICATE_CODE' } });
      }
      org.code = code;
    }

    // Notice we do NOT allow changing `type` or `parentId` after creation 
    // to prevent severing hierarchy connections with cascading effects.

    await org.save();

    const { logAudit } = require('../utils/auditLogger');
    await logAudit({
      userId: req.user._id,
      action: 'ORGANIZATION_UPDATED',
      entityType: 'Organization',
      entityId: org._id.toString(),
      before: beforeState,
      after: { name: org.name, code: org.code, location: org.location, status: org.status }
    });

    res.json({ success: true, data: org });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating organization' });
  }
};

// @desc    Delete organization (soft delete)
// @route   DELETE /api/organizations/:id
// @access  Private/Admin
export const deleteOrganization = async (req: any, res: ExpressRes) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found', error: { code: 'NOT_FOUND' } });
    }

    // Check if it has active children
    const children = await Organization.countDocuments({ parentId: org._id, status: 'ACTIVE' });
    if (children > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete organization with active children', 
        error: { code: 'HAS_CHILDREN' } 
      });
    }

    org.status = 'INACTIVE';
    await org.save();

    const { logAudit } = require('../utils/auditLogger');
    await logAudit({
      userId: req.user._id,
      action: 'ORGANIZATION_DELETED',
      entityType: 'Organization',
      entityId: org._id.toString(),
      before: { status: 'ACTIVE' },
      after: { status: 'INACTIVE' }
    });

    res.json({ success: true, message: 'Organization marked as INACTIVE' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting organization' });
  }
};
