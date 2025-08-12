import { prisma } from '../prisma';
import { Role } from '@prisma/client';
import { 
  validateUserCreation, 
  getCreatableRoles, 
  isTopLevelRole,
  SHARE_CONSTRAINTS,
  ROLE_CREATION_PERMISSIONS
} from './shareCommissionService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CreateUserRequest {
  name: string;
  password: string;
  contactno?: string;
  reference?: string;
  creditLimit?: number;
  role: Role;
  parentId: string;
  // Share and commission for the new user
  share: number;
  matchCommission?: number;
  sessionCommission?: number;
  casinoCommission?: number;
  commissionType?: string;
  casinoStatus?: boolean;
  casinoShare?: number;
  // Parent's commission values (editable)
  myMatchCommission?: number;
  mySessionCommission?: number;
  myCasinoCommission?: number;
  myCasinoShare?: number;
}

export interface UpdateUserRequest {
  userId: string;
  name?: string;
  password?: string;
  contactno?: string;
  reference?: string;
  creditLimit?: number;
  // Share and commission updates
  share?: number;
  matchCommission?: number;
  sessionCommission?: number;
  casinoCommission?: number;
  commissionType?: string;
  casinoStatus?: boolean;
  casinoShare?: number;
  // Parent's commission values (editable)
  myMatchCommission?: number;
  mySessionCommission?: number;
  myCasinoCommission?: number;
  myCasinoShare?: number;
}

// ============================================================================
// ROLE-BASED USER CREATION
// ============================================================================

/**
 * Creates a user with proper role hierarchy validation and share assignment
 */
export async function createUserWithRoleValidation(request: CreateUserRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const {
      name,
      password,
      contactno,
      reference,
      creditLimit = 0,
      role,
      parentId,
      share,
      matchCommission = 0,
      sessionCommission = 0,
      casinoCommission = 0,
      commissionType = 'NoCommission',
      casinoStatus = false,
      casinoShare = 0,
      myMatchCommission,
      mySessionCommission,
      myCasinoCommission,
      myCasinoShare
    } = request;

    // Get parent user to validate role hierarchy
    const parentUser = await prisma.user.findUnique({
      where: { id: parentId },
      include: { userCommissionShare: true }
    });

    if (!parentUser) {
      return { success: false, error: 'Parent user not found' };
    }

    // Validate role creation permission
    const roleValidation = validateUserCreation(parentUser.role, role, share);
    if (roleValidation) {
      return { success: false, error: roleValidation };
    }

    // Validate share constraints for top-level roles
    if (isTopLevelRole(role) && share !== SHARE_CONSTRAINTS.TOP_LEVEL_SHARE) {
      return { 
        success: false, 
        error: `Top-level role ${role} must have ${SHARE_CONSTRAINTS.TOP_LEVEL_SHARE}% share` 
      };
    }

    // Generate unique username/code
    const existingUsers = await prisma.user.findMany({ 
      select: { username: true, code: true } 
    });
    const existingUsernames = existingUsers.map(u => u.username);
    const existingCodes = existingUsers.map(u => u.code).filter(Boolean);

    const code = generateUniqueCode(role, existingCodes);
    const username = code;

    // Validate credit limit deduction from parent
    if (creditLimit > 0) {
      if (parentUser.creditLimit < creditLimit) {
        return { 
          success: false, 
          error: `Parent user (${parentUser.name || parentUser.code || parentUser.username}) does not have enough credit limit. Parent has ${parentUser.creditLimit} but ${creditLimit} is required. Please reduce the credit limit or add more limit to the parent first.` 
        };
      }
    }

    // Create user with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from parent's credit limit if needed
      if (creditLimit > 0) {
        await tx.user.update({
          where: { id: parentUser.id },
          data: { creditLimit: parentUser.creditLimit - creditLimit }
        });
      }

      // Create the user
      const user = await tx.user.create({
        data: {
          username,
          name,
          password, // Store in plain text for credential sharing
          role,
          parentId,
          creditLimit,
          balance: 0,
          isActive: true,
          code,
          reference: reference || null,
          contactno: contactno || null,
          casinoStatus
        }
      });

      // Create commission share record
      const commissionShareData = {
        userId: user.id,
        share,
        cshare: casinoStatus ? (casinoShare || share) : 0,
        icshare: 0,
        casinocommission: casinoCommission,
        matchcommission: matchCommission,
        sessioncommission: sessionCommission,
        sessionCommission: sessionCommission,
        session_commission_type: commissionType === 'BetByBet' ? 'BetByBet' : 'No Comm',
        commissionType
      };

      await tx.userCommissionShare.create({
        data: commissionShareData
      });

      // Update parent's commission values if provided
      if (myMatchCommission !== undefined || mySessionCommission !== undefined || 
          myCasinoCommission !== undefined || myCasinoShare !== undefined) {
        
        const parentUpdateData: any = {};
        
        if (myMatchCommission !== undefined) {
          parentUpdateData.matchcommission = myMatchCommission;
        }
        if (mySessionCommission !== undefined) {
          parentUpdateData.sessioncommission = mySessionCommission;
        }
        if (myCasinoCommission !== undefined) {
          parentUpdateData.casinocommission = myCasinoCommission;
        }
        if (myCasinoShare !== undefined) {
          parentUpdateData.cshare = myCasinoShare;
        }

        if (Object.keys(parentUpdateData).length > 0) {
          await tx.userCommissionShare.update({
            where: { userId: parentId },
            data: parentUpdateData
          });
        }
      }

      // Create ledger entries for credit limit allocation
      if (creditLimit > 0) {
        // Create ledger entry for the new user
        await tx.ledger.create({
          data: {
            userId: user.id,
            collection: 'LIMIT_UPDATE',
            debit: 0,
            credit: creditLimit,
            balanceAfter: creditLimit,
            type: 'ADJUSTMENT',
            remark: `Credit limit allocation from parent: ${parentUser.name || parentUser.code || parentUser.username}`,
          }
        });

        // Create ledger entry for parent if deduction occurred
        await tx.ledger.create({
          data: {
            userId: parentId,
            collection: 'LIMIT_UPDATE',
            debit: creditLimit,
            credit: 0,
            balanceAfter: parentUser.creditLimit - creditLimit,
            type: 'ADJUSTMENT',
            remark: `Credit limit deduction for new user: ${user.name || user.username}`,
          }
        });
      }

      return await tx.user.findUnique({
        where: { id: user.id },
        include: {
          userCommissionShare: true,
          parent: {
            include: {
              userCommissionShare: true
            }
          }
        }
      });
    });

    return { success: true, user: result };

  } catch (error) {
    console.error('Error in createUserWithRoleValidation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Updates a user with role-based validation
 */
export async function updateUserWithRoleValidation(request: UpdateUserRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const { userId, ...updateData } = request;

    // Get user to validate
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCommissionShare: true,
        parent: {
          include: { userCommissionShare: true }
        }
      }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Validate share updates for top-level roles
    if (updateData.share !== undefined && isTopLevelRole(user.role)) {
      return { 
        success: false, 
        error: `Cannot edit share for top-level role: ${user.role}` 
      };
    }

    // Use transaction for updates
    const result = await prisma.$transaction(async (tx) => {
      // Update basic user data
      const userUpdateData: any = {};
      if (updateData.name !== undefined) userUpdateData.name = updateData.name;
      if (updateData.password !== undefined) userUpdateData.password = updateData.password;
      if (updateData.contactno !== undefined) userUpdateData.contactno = updateData.contactno;
      if (updateData.reference !== undefined) userUpdateData.reference = updateData.reference;
      if (updateData.creditLimit !== undefined) userUpdateData.creditLimit = updateData.creditLimit;
      if (updateData.casinoStatus !== undefined) userUpdateData.casinoStatus = updateData.casinoStatus;

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdateData
        });
      }

      // Update commission share data
      if (updateData.share !== undefined || updateData.matchCommission !== undefined || 
          updateData.sessionCommission !== undefined || updateData.casinoCommission !== undefined ||
          updateData.commissionType !== undefined || updateData.casinoShare !== undefined) {
        
        const commissionUpdateData: any = {};
        
        if (updateData.share !== undefined) commissionUpdateData.share = updateData.share;
        if (updateData.matchCommission !== undefined) commissionUpdateData.matchcommission = updateData.matchCommission;
        if (updateData.sessionCommission !== undefined) {
          commissionUpdateData.sessioncommission = updateData.sessionCommission;
          commissionUpdateData.sessionCommission = updateData.sessionCommission;
        }
        if (updateData.casinoCommission !== undefined) commissionUpdateData.casinocommission = updateData.casinoCommission;
        if (updateData.commissionType !== undefined) commissionUpdateData.commissionType = updateData.commissionType;
        if (updateData.casinoShare !== undefined) commissionUpdateData.cshare = updateData.casinoShare;

        if (Object.keys(commissionUpdateData).length > 0) {
          await tx.userCommissionShare.update({
            where: { userId },
            data: commissionUpdateData
          });
        }
      }

      // Update parent's commission values if provided
      if (user.parent && (updateData.myMatchCommission !== undefined || 
          updateData.mySessionCommission !== undefined || 
          updateData.myCasinoCommission !== undefined || 
          updateData.myCasinoShare !== undefined)) {
        
        const parentUpdateData: any = {};
        
        if (updateData.myMatchCommission !== undefined) {
          parentUpdateData.matchcommission = updateData.myMatchCommission;
        }
        if (updateData.mySessionCommission !== undefined) {
          parentUpdateData.sessioncommission = updateData.mySessionCommission;
        }
        if (updateData.myCasinoCommission !== undefined) {
          parentUpdateData.casinocommission = updateData.myCasinoCommission;
        }
        if (updateData.myCasinoShare !== undefined) {
          parentUpdateData.cshare = updateData.myCasinoShare;
        }

        if (Object.keys(parentUpdateData).length > 0) {
          await tx.userCommissionShare.update({
            where: { userId: user.parent.id },
            data: parentUpdateData
          });
        }
      }

      return await tx.user.findUnique({
        where: { id: userId },
        include: {
          userCommissionShare: true,
          parent: {
            include: {
              userCommissionShare: true
            }
          }
        }
      });
    });

    return { success: true, user: result };

  } catch (error) {
    console.error('Error in updateUserWithRoleValidation:', error);
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
 * Generates a unique code for a user based on their role (3 alpha + 4 numericals)
 */
function generateUniqueCode(role: Role, existingCodes: string[]): string {
  const rolePrefix = getRolePrefix(role);
  let counter = 1;
  let code = `${rolePrefix}${counter.toString().padStart(4, '0')}`;
  
  while (existingCodes.includes(code)) {
    counter++;
    code = `${rolePrefix}${counter.toString().padStart(4, '0')}`;
  }
  
  return code;
}

/**
 * Gets the prefix for a role (3 letters)
 */
function getRolePrefix(role: Role): string {
  const prefixes: Record<Role, string> = {
    SUB_OWNER: 'SOW',
    SUPER_ADMIN: 'SUD',
    ADMIN: 'ADM',
    SUB: 'SUB',
    MASTER: 'MAS',
    SUPER_AGENT: 'SUP',
    AGENT: 'AGE',
    USER: 'USE',
    OWNER: 'OWN'
  };
  
  return prefixes[role] || 'USR';
}

/**
 * Gets all roles that can be created by a parent role
 */
export function getAvailableRolesForParent(parentRole: Role): Role[] {
  return getCreatableRoles(parentRole);
}

/**
 * Validates if a role combination is valid for parent-child relationship
 */
export function validateParentChildRole(parentRole: Role, childRole: Role): string | null {
  return validateUserCreation(parentRole, childRole, 0); // Share validation not needed here
}

// ============================================================================
// END OF SERVICE
// ============================================================================ 