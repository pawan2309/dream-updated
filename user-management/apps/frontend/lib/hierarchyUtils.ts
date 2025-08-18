// Updated hierarchy order (highest to lowest)
const ROLE_HIERARCHY = {
  OWNER: 9,
  SUB_OWNER: 8,
  SUPER_ADMIN: 7,
  ADMIN: 6,
  SUB: 5,
  MASTER: 4,
  SUPER_AGENT: 3,
  AGENT: 2,
  USER: 1
};

export type Role = keyof typeof ROLE_HIERARCHY;

// Function to get hierarchy index
export function getHierarchyIndex(role: string): number {
  // Server-side logging
  if (typeof window === 'undefined') {
    console.log('🔵 [SSR] getHierarchyIndex called with role:', role);
  }
  
  console.log('🔵 getHierarchyIndex called with role:', role);
  const index = ROLE_HIERARCHY[role as Role];
  console.log('🔵 Role hierarchy index:', index);
  if (index === undefined) {
    console.warn(`🔴 Invalid role: ${role}`);
    return 0; // Return lowest priority for invalid roles
  }
  return index;
}

// Function to check if creation is direct subordinate or skip hierarchy
export function checkHierarchyRelationship(creatorRole: string, newUserRole: string): {
  isDirectSubordinate: boolean;
  upperRole: string | null;
  skipLevel: number;
} {
  const creatorIndex = getHierarchyIndex(creatorRole);
  const newUserIndex = getHierarchyIndex(newUserRole);
  
  if (creatorIndex === undefined || newUserIndex === undefined) {
    return { isDirectSubordinate: false, upperRole: null, skipLevel: 0 };
  }
  
  // For hierarchy: higher index = lower authority
  // So creatorIndex should be higher than newUserIndex for valid creation
  if (creatorIndex <= newUserIndex) {
    // Creator cannot create same level or higher level
    return { isDirectSubordinate: false, upperRole: null, skipLevel: 0 };
  }
  
  const skipLevel = creatorIndex - newUserIndex;
  
  if (skipLevel === 1) {
    // Direct subordinate (e.g., SUB_OWNER creates SUB)
    return { isDirectSubordinate: true, upperRole: null, skipLevel: 1 };
  } else if (skipLevel > 1) {
    // Skip hierarchy (e.g., SUB_OWNER creates MASTER)
    // Find the immediate parent role
    const immediateParentIndex = newUserIndex + 1;
    const immediateParentRole = Object.keys(ROLE_HIERARCHY).find(role => 
      ROLE_HIERARCHY[role as Role] === immediateParentIndex
    );
    return { isDirectSubordinate: false, upperRole: immediateParentRole || null, skipLevel };
  } else {
    // Shouldn't happen
    return { isDirectSubordinate: false, upperRole: null, skipLevel };
  }
}

// Function to get display name for role
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'OWNER': return 'Owner';
    case 'SUB_OWNER': return 'Sub Owner';
    case 'SUPER_ADMIN': return 'Super Admin';
    case 'ADMIN': return 'Admin';
    case 'SUB': return 'Sub Admin';
    case 'MASTER': return 'Master';
    case 'SUPER_AGENT': return 'Super Agent';
    case 'AGENT': return 'Agent';
    case 'USER': return 'Client';
    default: return role;
  }
}

// Function to get modal title for hierarchy selection
export function getHierarchyModalTitle(upperRole: string): string {
  return `Select ${getRoleDisplayName(upperRole)}`;
}

// Function to check if a user can access a specific role's data
export function canAccessRole(userRole: string, targetRole: string): boolean {
  // Special handling for SUB_OWNER - give full access to everything
  if (userRole === 'SUB_OWNER') {
    return true;
  }
  
  const userIndex = getHierarchyIndex(userRole);
  const targetIndex = getHierarchyIndex(targetRole);
  
  if (userIndex === undefined || targetIndex === undefined) {
    return false;
  }
  
  // User can only access roles that are lower in hierarchy (higher index)
  // NOT same level or above
  return targetIndex > userIndex;
}

// Function to get accessible roles for a user
export function getAccessibleRoles(userRole: string): string[] {
  // Special handling for SUB_OWNER - give access to all roles
  if (userRole === 'SUB_OWNER') {
    return Object.keys(ROLE_HIERARCHY);
  }
  
  const userIndex = getHierarchyIndex(userRole);
  
  if (userIndex === undefined) {
    return [];
  }
  
  // Return all roles that are lower in hierarchy (higher index)
  // NOT same level or above
  return Object.keys(ROLE_HIERARCHY).filter(role => ROLE_HIERARCHY[role as Role] > userIndex).map(role => role);
}

// Function to check if user can access specific features
export function canAccessFeature(userRole: string, feature: string): boolean {
  // Special handling for SUB_OWNER - give access to all features
  if (userRole === 'SUB_OWNER') {
    return true;
  }
  
  // Map features to the minimum role required to access them
  const featureMinRole: Record<string, string> = {
    'login_reports': 'ADMIN',
    'super_admin_management': 'SUPER_ADMIN',
    'admin_management': 'ADMIN',
    'sub_owner_management': 'SUB_OWNER',
    'sub_management': 'SUB',
    'master_management': 'MASTER',
    'super_agent_management': 'SUPER_AGENT',
    'agent_management': 'AGENT',
    'client_management': 'USER',
  };
  const userIndex = getHierarchyIndex(userRole);
  const minRole = featureMinRole[feature];
  if (!minRole) return false;
  const minIndex = getHierarchyIndex(minRole);
  // User can access the feature if the feature's min role is below the user's role
  return minIndex > userIndex;
}

// Function to check if user can access restricted sections (COMMISSIONS, OLD DATA, LOGIN REPORTS)
export function canAccessRestrictedSections(userRole: string): boolean {
  // Only SUB_OWNER and above can access these sections
  const restrictedRoles = ['SUB_OWNER'];
  return restrictedRoles.includes(userRole);
}

// Function to check if a user can access another user's data based on hierarchy
export function canAccessUserData(requestingUserRole: string, targetUserRole: string): boolean {
  // Special handling for SUB_OWNER - can access all user data
  if (requestingUserRole === 'SUB_OWNER') {
    return true;
  }
  
  const requestingIndex = getHierarchyIndex(requestingUserRole);
  const targetIndex = getHierarchyIndex(targetUserRole);
  
  if (requestingIndex === undefined || targetIndex === undefined) {
    return false;
  }
  
  // User can only access data for users below them in hierarchy (higher index)
  // NOT same level or above
  return targetIndex > requestingIndex;
}

// Function to get role-based navigation items
export function getRoleBasedNavigation(userRole: string) {
  // Server-side logging
  if (typeof window === 'undefined') {
    console.log('🔵 [SSR] getRoleBasedNavigation called with role:', userRole);
  }
  
  console.log('🔵 getRoleBasedNavigation called with role:', userRole);
  if (!userRole || typeof userRole !== 'string') {
    console.warn('🔴 Invalid userRole provided to getRoleBasedNavigation:', userRole);
    return {};
  }
  
  const userIndex = getHierarchyIndex(userRole);
  console.log('🔵 User hierarchy index:', userIndex);
  if (userIndex === 0) {
    console.warn(`🔴 Invalid role "${userRole}" provided to getRoleBasedNavigation`);
    return {};
  }

  const allNavigation = {
    'USER DETAILS': [
      { label: 'Super Admin ', href: '/user_details/super_admin', icon: 'fas fa-user-shield', role: 'SUPER_ADMIN' },
      { label: 'Admin ', href: '/user_details/admin', icon: 'fas fa-user-shield', role: 'ADMIN' },
      { label: 'Sub Agent ', href: '/user_details/sub', icon: 'fas fa-chess-rook', role: 'SUB' },
      { label: 'Master Agent ', href: '/user_details/master', icon: 'fas fa-crown', role: 'MASTER' },
      { label: 'Super Agent ', href: '/user_details/super', icon: 'fas fa-user-tie', role: 'SUPER_AGENT' },
      { label: 'Agent ', href: '/user_details/agent', icon: 'fas fa-user-shield', role: 'AGENT' },
      { label: 'Client ', href: '/user_details/client', icon: 'fas fa-user', role: 'USER' },
      { label: 'Dead Users', href: '/user_details/dead', icon: 'fa fa-user-slash', role: 'USER' },
    ],
    'GAMES': [
      { label: 'InPlay Game', href: '/game/inPlay', icon: 'fas fa-play', role: 'USER' },
      { label: 'Complete Game', href: '/game/completeGame', icon: 'far fa-stop-circle', role: 'USER' },
    ],
    'Casino': [
      { label: 'Live Casino Position', href: '#', icon: 'fas fa-chart-line', role: 'USER' },
      { label: 'Casino Details', href: '#', icon: 'fas fa-wallet', role: 'USER' },
      { label: 'Int. Casino Details', href: '#', icon: 'fas fa-chart-line', role: 'USER' },
    ],
    'CASH TRANSACTION': [
      { label: 'Debit/Credit Entry (Super Admin)', href: '/ct/super_admin', icon: 'fas fa-angle-right', role: 'SUPER_ADMIN' },
      { label: 'Debit/Credit Entry (Admin)', href: '/ct/admin', icon: 'fas fa-angle-right', role: 'ADMIN' },
      { label: 'Debit/Credit Entry (Sub)', href: '/ct/sub', icon: 'fas fa-angle-right', role: 'SUB' },
      { label: 'Debit/Credit Entry (M)', href: '/ct/master', icon: 'fas fa-angle-right', role: 'MASTER' },
      { label: 'Debit/Credit Entry (S)', href: '/ct/super', icon: 'fas fa-angle-right', role: 'SUPER_AGENT' },
      { label: 'Debit/Credit Entry (A)', href: '/ct/agent', icon: 'fas fa-angle-right', role: 'AGENT' },
      { label: 'Debit/Credit Entry (C)', href: '/ct/client', icon: 'fas fa-angle-right', role: 'USER' },
    ],
    'LEDGER': [
      { label: 'My Ledger', href: '/ledger', icon: 'fas fa-angle-right', role: 'USER' },
      { label: 'All Super Admin Ledger', href: '/ledger/super_admin', icon: 'fas fa-angle-right', role: 'SUPER_ADMIN' },
      { label: 'All Admin Ledger', href: '/ledger/admin', icon: 'fas fa-angle-right', role: 'ADMIN' },
      { label: 'All Sub Ledger', href: '/ledger/sub', icon: 'fas fa-angle-right', role: 'SUB' },
      { label: 'All Master Ledger', href: '/ledger/master', icon: 'fas fa-angle-right', role: 'MASTER' },
      { label: 'All Super Ledger', href: '/ledger/super', icon: 'fas fa-angle-right', role: 'SUPER_AGENT' },
      { label: 'All Agent Ledger', href: '/ledger/agent', icon: 'fas fa-angle-right', role: 'AGENT' },
      { label: 'All Client Ledger', href: '/ledger/client', icon: 'fas fa-angle-right', role: 'USER' },
      { label: 'Client Plus/Minus', href: '/ledger/client/pm', icon: 'fas fa-angle-right', role: 'USER' },
    ],
    'COMMISSIONS': [
      { label: 'Commission Dashboard', href: '/commissions', icon: 'fas fa-coins', role: 'USER' },
    ],
    'OLD DATA': [
      { label: 'Old Ledger', href: '#', icon: 'fas fa-angle-right', role: 'USER' },
      { label: 'Old Casino Data', href: '#', icon: 'fas fa-angle-right', role: 'USER' },
    ],
    'Login Reports': [
      { label: 'All Login Reports', href: '/reports/login-reports', icon: 'fas fa-clipboard-list', role: 'ADMIN' },
      { label: 'Super Admin Login Reports', href: '/reports/login-reports?role=SUPER_ADMIN', icon: 'fas fa-clipboard-list', role: 'SUPER_ADMIN' },
      { label: 'Admin Login Reports', href: '/reports/login-reports?role=ADMIN', icon: 'fas fa-clipboard-list', role: 'ADMIN' },
      { label: 'Sub Login Reports', href: '/reports/login-reports?role=SUB', icon: 'fas fa-clipboard-list', role: 'SUB' },
      { label: 'Master Login Reports', href: '/reports/login-reports?role=MASTER', icon: 'fas fa-clipboard-list', role: 'MASTER' },
      { label: 'Super Login Reports', href: '/reports/login-reports?role=SUPER_AGENT', icon: 'fas fa-clipboard-list', role: 'SUPER_AGENT' },
      { label: 'Agent Login Reports', href: '/reports/login-reports?role=AGENT', icon: 'fas fa-clipboard-list', role: 'AGENT' },
    ],
  };

  // Special handling for SUB_OWNER - give full access to everything
  if (userRole === 'SUB_OWNER') {
    return allNavigation;
  }
  
  const filteredNavigation: Record<string, any[]> = {};
  
  Object.entries(allNavigation).forEach(([section, links]) => {
    // Check if this is a restricted section
    const isRestrictedSection = ['COMMISSIONS', 'OLD DATA', 'Login Reports'].includes(section);
    
    if (isRestrictedSection) {
      // Only show restricted sections to SUB_OWNER and above
      if (canAccessRestrictedSections(userRole)) {
        // For restricted sections, filter links based on hierarchy (only show roles below user)
        const filteredLinks = links.filter(link => {
          const linkIndex = getHierarchyIndex(link.role);
          return linkIndex > userIndex; // Only show links for roles below the user
        });
        if (filteredLinks.length > 0) {
          filteredNavigation[section] = filteredLinks;
        }
      }
      // If user can't access restricted sections, don't add them at all
    } else {
      // For non-restricted sections, filter links based on hierarchy (only show roles below user)
      const filteredLinks = links.filter(link => {
        const linkIndex = getHierarchyIndex(link.role);
        return linkIndex > userIndex; // Only show links for roles below the user
      });
      if (filteredLinks.length > 0) {
        filteredNavigation[section] = filteredLinks;
      }
    }
  });
  
  console.log('🔵 Final filtered navigation:', filteredNavigation);
  return filteredNavigation;
} 