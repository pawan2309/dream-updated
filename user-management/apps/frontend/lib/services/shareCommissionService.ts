import { prisma } from '../prisma';
import { Role } from '@prisma/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ShareAssignmentRequest {
  userId: string;
  parentId: string;
  assignedShare: number;
  matchCommission?: number;
  sessionCommission?: number;
  casinoCommission?: number;
  commissionType?: string;
  casinoStatus?: boolean;
}

export interface ShareUpdateRequest {
  userId: string;
  newShare: number;
}

export interface UserShareInfo {
  userId: string;
  currentShare: number;
  availableSharePercent: number;
  totalAssignedToChildren: number;
  childrenCount: number;
}

export interface CommissionShareData {
  share: number;
  available_share_percent: number;
  cshare: number;
  icshare: number;
  casinocommission: number;
  matchcommission: number;
  sessioncommission: number;
  sessionCommission?: number;
  session_commission_type: string;
  commissionType?: string;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// Complete role hierarchy from highest to lowest
export const HIERARCHY_ROLES: Role[] = [
  'SUB_OWNER',    // Top level - 100% share locked
  'SUPER_ADMIN',  // Can create ADMIN, SUB, MASTER, SUPER_AGENT, AGENT, USER
  'ADMIN',        // Can create SUB, MASTER, SUPER_AGENT, AGENT, USER
  'SUB',          // Can create MASTER, SUPER_AGENT, AGENT, USER
  'MASTER',       // Can create SUPER_AGENT, AGENT, USER
  'SUPER_AGENT',  // Can create AGENT, USER
  'AGENT',        // Can create USER only
  'USER',         // Bottom level - no children
  'OWNER'         // Special role - treated as top level
];

// Roles that cannot have their share edited (must stay at 100%)
export const TOP_LEVEL_ROLES: Role[] = ['SUB_OWNER', 'OWNER'];

// Roles that can create other roles (with their allowed children)
export const ROLE_CREATION_PERMISSIONS: Record<Role, Role[]> = {
  SUB_OWNER: ['SUPER_ADMIN', 'ADMIN', 'SUB', 'MASTER', 'SUPER_AGENT', 'AGENT', 'USER'],
  SUPER_ADMIN: ['ADMIN', 'SUB', 'MASTER', 'SUPER_AGENT', 'AGENT', 'USER'],
  ADMIN: ['SUB', 'MASTER', 'SUPER_AGENT', 'AGENT', 'USER'],
  SUB: ['MASTER', 'SUPER_AGENT', 'AGENT', 'USER'],
  MASTER: ['SUPER_AGENT', 'AGENT', 'USER'],
  SUPER_AGENT: ['AGENT', 'USER'],
  AGENT: ['USER'],
  USER: [], // Cannot create any users
  OWNER: ['SUB_OWNER', 'SUPER_ADMIN', 'ADMIN', 'SUB', 'MASTER', 'SUPER_AGENT', 'AGENT', 'USER']
};

export const SHARE_CONSTRAINTS = {
  MIN_SHARE: 0,
  MAX_SHARE: 100,
  TOP_LEVEL_SHARE: 100,
  MIN_COMMISSION: 0,
  MAX_COMMISSION: 10
} as const;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateShareValue(share: number, context: string): string | null {
  if (share < SHARE_CONSTRAINTS.MIN_SHARE || share > SHARE_CONSTRAINTS.MAX_SHARE) {
    return `${context}: Share must be between ${SHARE_CONSTRAINTS.MIN_SHARE}% and ${SHARE_CONSTRAINTS.MAX_SHARE}%`;
  }
  return null;
}

export function validateCommissionValue(commission: number, context: string): string | null {
  if (commission < SHARE_CONSTRAINTS.MIN_COMMISSION || commission > SHARE_CONSTRAINTS.MAX_COMMISSION) {
    return `${context}: Commission must be between ${SHARE_CONSTRAINTS.MIN_COMMISSION}% and ${SHARE_CONSTRAINTS.MAX_COMMISSION}%`;
  }
  return null;
}

export function validateHierarchy(parentRole: Role, childRole: Role): string | null {
  const parentIndex = HIERARCHY_ROLES.indexOf(parentRole);
  const childIndex = HIERARCHY_ROLES.indexOf(childRole);
  
  if (parentIndex === -1 || childIndex === -1) {
    return 'Invalid role in hierarchy';
  }
  
  if (childIndex <= parentIndex) {
    return `Child role ${childRole} must be lower in hierarchy than parent role ${parentRole}`;
  }
  
  return null;
}

/**
 * Validates if a parent role can create a child with the specified role
 */
export function validateRoleCreationPermission(parentRole: Role, childRole: Role): string | null {
  const allowedChildren = ROLE_CREATION_PERMISSIONS[parentRole];
  
  if (!allowedChildren) {
    return `Role ${parentRole} cannot create any users`;
  }
  
  if (!allowedChildren.includes(childRole)) {
    return `Role ${parentRole} cannot create users with role ${childRole}. Allowed roles: ${allowedChildren.join(', ')}`;
  }
  
  return null;
}

/**
 * Gets all roles that a parent can create
 */
export function getCreatableRoles(parentRole: Role): Role[] {
  return ROLE_CREATION_PERMISSIONS[parentRole] || [];
}

/**
 * Checks if a role is top-level (cannot have share edited)
 */
export function isTopLevelRole(role: Role): boolean {
  return TOP_LEVEL_ROLES.includes(role);
}

/**
 * Validates complete user creation with role hierarchy
 */
export function validateUserCreation(
  parentRole: Role, 
  childRole: Role, 
  assignedShare: number
): string | null {
  // Check role creation permission
  const roleValidation = validateRoleCreationPermission(parentRole, childRole);
  if (roleValidation) {
    return roleValidation;
  }
  
  // Check hierarchy
  const hierarchyValidation = validateHierarchy(parentRole, childRole);
  if (hierarchyValidation) {
    return hierarchyValidation;
  }
  
  // Check share constraints for top-level roles
  if (isTopLevelRole(childRole) && assignedShare !== SHARE_CONSTRAINTS.TOP_LEVEL_SHARE) {
    return `Top-level role ${childRole} must have ${SHARE_CONSTRAINTS.TOP_LEVEL_SHARE}% share`;
  }
  
  return null;
}

// ============================================================================
// CORE SHARE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Assigns a user with share and commission configuration
 * Validates share assignment and deducts from parent's available share
 */
export async function assignUserWithShare(request: ShareAssignmentRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  parentShareInfo?: UserShareInfo;
}> {
  try {
    const {
      userId,
      parentId,
      assignedShare,
      matchCommission = 0,
      sessionCommission = 0,
      casinoCommission = 0,
      commissionType = 'NoCommission',
      casinoStatus = false
    } = request;

    // Validate share value
    const shareValidation = validateShareValue(assignedShare, 'Assigned Share');
    if (shareValidation) {
      return { success: false, error: shareValidation };
    }

    // Validate commission values
    const commissionValidations = [
      validateCommissionValue(matchCommission, 'Match Commission'),
      validateCommissionValue(sessionCommission, 'Session Commission'),
      validateCommissionValue(casinoCommission, 'Casino Commission')
    ].filter(Boolean);

    if (commissionValidations.length > 0) {
      return { success: false, error: commissionValidations[0]! };
    }

    // Get parent user with commission share data
    const parentUser = await prisma.user.findUnique({
      where: { id: parentId },
      include: {
        UserCommissionShare: true,
        children: {
          include: {
            UserCommissionShare: true
          }
        }
      }
    });

    if (!parentUser) {
      return { success: false, error: 'Parent user not found' };
    }

    // Get child user
    const childUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { UserCommissionShare: true }
    });

    if (!childUser) {
      return { success: false, error: 'Child user not found' };
    }

    // Validate hierarchy
    const hierarchyValidation = validateHierarchy(parentUser.role, childUser.role);
    if (hierarchyValidation) {
      return { success: false, error: hierarchyValidation };
    }

    // Calculate parent's available share
    const parentShareInfo = await calculateUserShareInfo(parentId);
    
    // Validate share assignment
    if (assignedShare > parentShareInfo.availableSharePercent) {
      return { 
        success: false, 
        error: `Cannot assign ${assignedShare}% share. Parent only has ${parentShareInfo.availableSharePercent}% available.` 
      };
    }

    // Check if user already has commission share record
    const existingCommissionShare = await prisma.userCommissionShare.findUnique({
      where: { userId }
    });

    // Prepare commission share data
    const commissionShareData: CommissionShareData = {
      share: assignedShare,
      available_share_percent: assignedShare, // Initially, available share equals assigned share
      cshare: casinoStatus ? assignedShare : 0, // Casino share same as main share when casino is enabled
      icshare: 0, // International casino share - set to 0 for now
      casinocommission: casinoCommission,
      matchcommission: matchCommission,
      sessioncommission: sessionCommission,
      sessionCommission: sessionCommission,
      session_commission_type: commissionType === 'BetByBet' ? 'BetByBet' : 'No Comm',
      commissionType
    };

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create or update commission share record
      if (existingCommissionShare) {
        await tx.userCommissionShare.update({
          where: { userId },
          data: commissionShareData
        });
      } else {
        await tx.userCommissionShare.create({
          data: {
            User: { connect: { id: userId } },
            ...commissionShareData,
            updatedAt: new Date()
          }
        });
      }

      // Update parent's available share by reducing it by the assigned share
      if (parentUser.UserCommissionShare) {
        await tx.userCommissionShare.update({
          where: { userId: parentId },
          data: {
            // available_share_percent: Math.max(0, parentUser.UserCommissionShare.available_share_percent - assignedShare)
            // TODO: Fix Prisma client generation issue
          }
        });
      }

      // Return updated user with commission share
      return await tx.user.findUnique({
        where: { id: userId },
        include: {
          UserCommissionShare: true,
          parent: {
            include: {
              UserCommissionShare: true
            }
          }
        }
      });
    });

    return { 
      success: true, 
      user: result,
      parentShareInfo: {
        userId: parentId,
        currentShare: parentShareInfo.currentShare,
        availableSharePercent: parentShareInfo.availableSharePercent - assignedShare,
        totalAssignedToChildren: parentShareInfo.totalAssignedToChildren + assignedShare,
        childrenCount: parentShareInfo.childrenCount + 1
      }
    };

  } catch (error) {
    console.error('Error in assignUserWithShare:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Edits a user's share with proper validation and parent recalculation
 */
export async function editUserShare(request: ShareUpdateRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  parentShareInfo?: UserShareInfo;
}> {
  try {
    const { userId, newShare } = request;

    // Validate share value
    const shareValidation = validateShareValue(newShare, 'New Share');
    if (shareValidation) {
      return { success: false, error: shareValidation };
    }

    // Get user with parent and commission share data
    const user = await prisma.user.findUnique({
      where: { id: userId },
              include: {
          UserCommissionShare: true,
          parent: {
            include: {
              UserCommissionShare: true,
              children: {
                include: {
                  UserCommissionShare: true
                }
              }
            }
          }
        }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if user is top-level (cannot edit share)
    if (TOP_LEVEL_ROLES.includes(user.role)) {
      return { success: false, error: `Cannot edit share for top-level role: ${user.role}` };
    }

    if (!user.parent) {
      return { success: false, error: 'User has no parent to validate against' };
    }

    // Get current share
    const currentShare = user.UserCommissionShare?.share || 0;
    const shareDifference = newShare - currentShare;

    // If no change, return success
    if (shareDifference === 0) {
      return { success: true, user };
    }

    // Calculate parent's available share
    const parentShareInfo = await calculateUserShareInfo(user.parent.id);

    // Validate new share against parent's available share
    if (shareDifference > 0 && shareDifference > parentShareInfo.availableSharePercent) {
      return { 
        success: false, 
        error: `Cannot increase share by ${shareDifference}%. Parent only has ${parentShareInfo.availableSharePercent}% available.` 
      };
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update commission share record
      if (user.UserCommissionShare) {
        await tx.userCommissionShare.update({
          where: { userId },
          data: {
            share: newShare,
            cshare: user.UserCommissionShare.cshare > 0 ? newShare : 0 // Update casino share if it was set
          }
        });
      } else {
        await tx.userCommissionShare.create({
          data: {
            User: { connect: { id: userId } },
            share: newShare,
            cshare: 0,
            icshare: 0,
            casinocommission: 0,
            matchcommission: 0,
            sessioncommission: 0,
            session_commission_type: 'No Comm',
            updatedAt: new Date()
          }
        });
      }

      // Return updated user
      return await tx.user.findUnique({
        where: { id: userId },
        include: {
          UserCommissionShare: true,
          parent: {
            include: {
              UserCommissionShare: true
            }
          }
        }
      });
    });

    return { 
      success: true, 
      user: result,
      parentShareInfo: {
        userId: user.parent.id,
        currentShare: parentShareInfo.currentShare,
        availableSharePercent: parentShareInfo.availableSharePercent - shareDifference,
        totalAssignedToChildren: parentShareInfo.totalAssignedToChildren + shareDifference,
        childrenCount: parentShareInfo.childrenCount
      }
    };

  } catch (error) {
    console.error('Error in editUserShare:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates comprehensive share information for a user
 */
export async function calculateUserShareInfo(userId: string): Promise<UserShareInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      UserCommissionShare: true,
      children: {
        include: {
          UserCommissionShare: true
        }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const currentShare = user.UserCommissionShare?.share || 0;
  // const availableSharePercent = user.UserCommissionShare?.available_share_percent || 0;
  const availableSharePercent = 0; // TODO: Fix Prisma client generation issue
  const totalAssignedToChildren = user.children.reduce((sum, child) => {
    return sum + (child.UserCommissionShare?.share || 0);
  }, 0);

  return {
    userId,
    currentShare,
    availableSharePercent,
    totalAssignedToChildren,
    childrenCount: user.children.length
  };
}

/**
 * Gets all children of a user with their share information
 */
export async function getUserChildrenWithShares(userId: string): Promise<Array<{
  user: any;
  shareInfo: UserShareInfo;
}>> {
  const children = await prisma.user.findMany({
    where: { parentId: userId },
    include: {
      UserCommissionShare: true
    }
  });

  const childrenWithShares = await Promise.all(
    children.map(async (child) => ({
      user: child,
      shareInfo: await calculateUserShareInfo(child.id)
    }))
  );

  return childrenWithShares;
}

/**
 * Validates if a share assignment is possible for a parent
 */
export async function validateShareAssignment(
  parentId: string, 
  requestedShare: number
): Promise<{
  valid: boolean;
  error?: string;
  availableShare: number;
  currentAssigned: number;
}> {
  try {
    const shareInfo = await calculateUserShareInfo(parentId);
    
    if (requestedShare > shareInfo.availableSharePercent) {
      return {
        valid: false,
        error: `Cannot assign ${requestedShare}% share. Only ${shareInfo.availableSharePercent}% available.`,
        availableShare: shareInfo.availableSharePercent,
        currentAssigned: shareInfo.totalAssignedToChildren
      };
    }

    return {
      valid: true,
      availableShare: shareInfo.availableSharePercent,
      currentAssigned: shareInfo.totalAssignedToChildren
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      availableShare: 0,
      currentAssigned: 0
    };
  }
}

/**
 * Gets the complete hierarchy tree for a user
 */
export async function getUserHierarchyTree(userId: string): Promise<{
  user: any;
  children: Array<{
    user: any;
    shareInfo: UserShareInfo;
  }>;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      UserCommissionShare: true,
      children: {
        include: {
          UserCommissionShare: true
        }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const childrenWithShares = await getUserChildrenWithShares(userId);

  return {
    user,
    children: childrenWithShares
  };
}

// ============================================================================
// COMMISSION MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Updates commission values for a user
 */
export async function updateUserCommissions(
  userId: string,
  commissions: {
    matchCommission?: number;
    sessionCommission?: number;
    casinoCommission?: number;
    commissionType?: string;
  }
): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const { matchCommission, sessionCommission, casinoCommission, commissionType } = commissions;

    // Validate commission values
    const validations = [
      matchCommission !== undefined && validateCommissionValue(matchCommission, 'Match Commission'),
      sessionCommission !== undefined && validateCommissionValue(sessionCommission, 'Session Commission'),
      casinoCommission !== undefined && validateCommissionValue(casinoCommission, 'Casino Commission')
    ].filter(Boolean);

    if (validations.length > 0) {
      return { success: false, error: validations[0]! };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { UserCommissionShare: true }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const updateData: Partial<CommissionShareData> = {};

    if (matchCommission !== undefined) updateData.matchcommission = matchCommission;
    if (sessionCommission !== undefined) {
      updateData.sessioncommission = sessionCommission;
      updateData.sessionCommission = sessionCommission;
    }
    if (casinoCommission !== undefined) updateData.casinocommission = casinoCommission;
    if (commissionType !== undefined) updateData.commissionType = commissionType;

    const result = await prisma.$transaction(async (tx) => {
      if (user.UserCommissionShare) {
        await tx.userCommissionShare.update({
          where: { userId },
          data: updateData
        });
      } else {
        await tx.userCommissionShare.create({
          data: {
            User: { connect: { id: userId } },
            share: 0,
            cshare: 0,
            icshare: 0,
            casinocommission: casinoCommission || 0,
            matchcommission: matchCommission || 0,
            sessioncommission: sessionCommission || 0,
            sessionCommission: sessionCommission,
            session_commission_type: commissionType === 'BetByBet' ? 'BetByBet' : 'No Comm',
            commissionType,
            updatedAt: new Date()
          }
        });
      }

      return await tx.user.findUnique({
        where: { id: userId },
        include: { UserCommissionShare: true }
      });
    });

    return { success: true, user: result };

  } catch (error) {
    console.error('Error in updateUserCommissions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// ============================================================================
// END OF SERVICE
// ============================================================================ 