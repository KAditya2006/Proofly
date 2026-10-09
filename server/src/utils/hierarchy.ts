import mongoose from 'mongoose';
import Organization from '../models/Organization';
import Project from '../models/Project';

/**
 * Gets all descendant organization IDs for a given organization ID.
 * E.g., If orgId is a GROUP, it returns the GROUP ID, plus all its SUBSIDIARY IDs, plus all their BU IDs.
 */
export const getDescendantOrgIds = async (orgId: mongoose.Types.ObjectId | string): Promise<mongoose.Types.ObjectId[]> => {
  const rootId = new mongoose.Types.ObjectId(orgId as string);
  const orgs = await Organization.find({}).select('_id parentId');
  
  const childrenMap = new Map<string, mongoose.Types.ObjectId[]>();
  orgs.forEach(org => {
    if (org.parentId) {
      const pIdStr = org.parentId.toString();
      if (!childrenMap.has(pIdStr)) {
        childrenMap.set(pIdStr, []);
      }
      childrenMap.get(pIdStr)!.push(org._id);
    }
  });

  const descendants: mongoose.Types.ObjectId[] = [rootId];
  const queue: mongoose.Types.ObjectId[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenMap.get(current.toString()) || [];
    for (const child of children) {
      descendants.push(child);
      queue.push(child);
    }
  }

  return descendants;
};

/**
 * Gets all Project IDs that belong to the given organization or any of its descendants.
 */
export const getAuthorizedProjectIds = async (organizationId: mongoose.Types.ObjectId | string): Promise<mongoose.Types.ObjectId[]> => {
  const descendantOrgIds = await getDescendantOrgIds(organizationId);
  const projects = await Project.find({
    $or: [
      { organizationId: { $in: descendantOrgIds } },
      { subsidiaryId: { $in: descendantOrgIds } },
      { businessUnitId: { $in: descendantOrgIds } }
    ]
  }).select('_id');
  return projects.map(p => p._id);
};

/**
 * Verifies if a given targetOrgId is a valid descendant (or self) of the user's organizationId.
 * Used to prevent IDOR when querying specific Subsidiaries or BUs.
 */
export const isAuthorizedScope = async (userOrgId: mongoose.Types.ObjectId | string, targetOrgId: mongoose.Types.ObjectId | string): Promise<boolean> => {
  const descendantOrgIds = await getDescendantOrgIds(userOrgId);
  return descendantOrgIds.some(id => id.toString() === targetOrgId.toString());
};
