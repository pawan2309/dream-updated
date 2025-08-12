import { Role } from './hierarchyUtils';

// Domain configuration
export const DOMAIN_CONFIG = {
  OPERATING_PANEL: 'admin.batxgames.site',
  OWNER: 'owner.batxgames.site',
  SUB_OWNER: 'subowner.batxgames.site',
  SUPER_ADMIN: 'superadmin.batxgames.site',
  ADMIN: 'admin.batxgames.site',
  SUB: 'sub.batxgames.site',
  MASTER: 'master.batxgames.site',
  SUPER_AGENT: 'superagent.batxgames.site',
  AGENT: 'agent.batxgames.site',
  USER: 'user.batxgames.site' // Separate package
} as const;

// Access control rules - each role has their own domain
export const DOMAIN_ACCESS_RULES: Record<Role, readonly string[]> = {
  OWNER: [DOMAIN_CONFIG.OPERATING_PANEL], // OWNER can only access operating panel
  SUB_OWNER: [DOMAIN_CONFIG.SUB_OWNER],
  SUPER_ADMIN: [DOMAIN_CONFIG.SUPER_ADMIN],
  ADMIN: [DOMAIN_CONFIG.ADMIN],
  SUB: [DOMAIN_CONFIG.SUB],
  MASTER: [DOMAIN_CONFIG.MASTER],
  SUPER_AGENT: [DOMAIN_CONFIG.SUPER_AGENT],
  AGENT: [DOMAIN_CONFIG.AGENT],
  USER: [DOMAIN_CONFIG.USER] // Separate package domain
} as const;

/**
 * Check if a user can access a specific domain
 */
export function canAccessDomain(userRole: Role, domain: string): boolean {
  const allowedDomains = DOMAIN_ACCESS_RULES[userRole];
  return allowedDomains.includes(domain);
}

/**
 * Get the primary domain for a user role
 */
export function getPrimaryDomain(userRole: Role): string {
  return DOMAIN_ACCESS_RULES[userRole][0];
}

/**
 * Check if user should be redirected based on their role and current domain
 */
export function shouldRedirect(userRole: Role, currentDomain: string): { shouldRedirect: boolean; targetDomain: string } {
  const primaryDomain = getPrimaryDomain(userRole);
  
  if (currentDomain !== primaryDomain) {
    return {
      shouldRedirect: true,
      targetDomain: primaryDomain
    };
  }
  
  return {
    shouldRedirect: false,
    targetDomain: currentDomain
  };
}

/**
 * Validate domain access for API requests
 */
export function validateDomainAccess(userRole: Role, requestDomain: string): boolean {
  return canAccessDomain(userRole, requestDomain);
}

/**
 * Get all accessible domains for a role
 */
export function getAccessibleDomains(userRole: Role): readonly string[] {
  return DOMAIN_ACCESS_RULES[userRole];
}

/**
 * Check if role is for user management (not USER role)
 */
export function isUserManagementRole(role: Role): boolean {
  return role !== 'USER' && role !== 'OWNER';
}

/**
 * Check if role is for operating panel only
 */
export function isOperatingPanelRole(role: Role): boolean {
  return role === 'OWNER';
}

/**
 * Check if role is for separate user package
 */
export function isUserPackageRole(role: Role): boolean {
  return role === 'USER';
} 