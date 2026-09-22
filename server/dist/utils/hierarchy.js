"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthorizedScope = exports.getAuthorizedProjectIds = exports.getDescendantOrgIds = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Organization_1 = __importDefault(require("../models/Organization"));
const Project_1 = __importDefault(require("../models/Project"));
/**
 * Gets all descendant organization IDs for a given organization ID.
 * E.g., If orgId is a GROUP, it returns the GROUP ID, plus all its SUBSIDIARY IDs, plus all their BU IDs.
 */
const getDescendantOrgIds = async (orgId) => {
    const rootId = new mongoose_1.default.Types.ObjectId(orgId);
    const orgs = await Organization_1.default.find({}).select('_id parentId');
    const childrenMap = new Map();
    orgs.forEach(org => {
        if (org.parentId) {
            const pIdStr = org.parentId.toString();
            if (!childrenMap.has(pIdStr)) {
                childrenMap.set(pIdStr, []);
            }
            childrenMap.get(pIdStr).push(org._id);
        }
    });
    const descendants = [rootId];
    const queue = [rootId];
    while (queue.length > 0) {
        const current = queue.shift();
        const children = childrenMap.get(current.toString()) || [];
        for (const child of children) {
            descendants.push(child);
            queue.push(child);
        }
    }
    return descendants;
};
exports.getDescendantOrgIds = getDescendantOrgIds;
/**
 * Gets all Project IDs that belong to the given organization or any of its descendants.
 */
const getAuthorizedProjectIds = async (organizationId) => {
    const descendantOrgIds = await (0, exports.getDescendantOrgIds)(organizationId);
    const projects = await Project_1.default.find({ organizationId: { $in: descendantOrgIds } }).select('_id');
    return projects.map(p => p._id);
};
exports.getAuthorizedProjectIds = getAuthorizedProjectIds;
/**
 * Verifies if a given targetOrgId is a valid descendant (or self) of the user's organizationId.
 * Used to prevent IDOR when querying specific Subsidiaries or BUs.
 */
const isAuthorizedScope = async (userOrgId, targetOrgId) => {
    const descendantOrgIds = await (0, exports.getDescendantOrgIds)(userOrgId);
    return descendantOrgIds.some(id => id.toString() === targetOrgId.toString());
};
exports.isAuthorizedScope = isAuthorizedScope;
