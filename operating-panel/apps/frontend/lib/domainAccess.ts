export type Role = 'OWNER' | 'SUB_OWNER' | 'SUPER_ADMIN' | 'ADMIN' | 'SUB' | 'MASTER' | 'SUPER_AGENT' | 'AGENT' | 'USER';

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

export const DOMAIN_ACCESS_RULES: Record<Role, readonly string[]> = {
  OWNER: [DOMAIN_CONFIG.OPERATING_PANEL],
  SUB_OWNER: [DOMAIN_CONFIG.SUB_OWNER],
  SUPER_ADMIN: [DOMAIN_CONFIG.SUPER_ADMIN],
  ADMIN: [DOMAIN_CONFIG.ADMIN],
  SUB: [DOMAIN_CONFIG.SUB],
  MASTER: [DOMAIN_CONFIG.MASTER],
  SUPER_AGENT: [DOMAIN_CONFIG.SUPER_AGENT],
  AGENT: [DOMAIN_CONFIG.AGENT],
  USER: [DOMAIN_CONFIG.USER]
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
 * Check if user should be redirected and get target domain
 */
export function shouldRedirect(userRole: Role, currentDomain: string): { shouldRedirect: boolean; targetDomain: string } {
  const primaryDomain = getPrimaryDomain(userRole);
  
  if (currentDomain === primaryDomain) {
    return { shouldRedirect: false, targetDomain: '' };
  }
  
  return { shouldRedirect: true, targetDomain: primaryDomain };
}

/**
 * Validate domain access for a user role
 */
export function validateDomainAccess(userRole: Role, requestDomain: string): boolean {
  return canAccessDomain(userRole, requestDomain);
}

/**
 * Get all accessible domains for a user role
 */
export function getAccessibleDomains(userRole: Role): readonly string[] {
  return DOMAIN_ACCESS_RULES[userRole];
}

/**
 * Check if role is for user management
 */
export function isUserManagementRole(role: Role): boolean {
  return role !== 'OWNER' && role !== 'USER';
}

/**
 * Check if role is for operating panel
 */
export function isOperatingPanelRole(role: Role): boolean {
  return role === 'OWNER';
}

/**
 * Check if role is for user package
 */
export function isUserPackageRole(role: Role): boolean {
  return role === 'USER';
} 