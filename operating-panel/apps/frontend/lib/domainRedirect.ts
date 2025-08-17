import { useUser } from './hooks/useUser';

interface DomainConfig {
  [key: string]: {
    allowedRoles: string[];
    redirectUrl?: string | null;
  };
}

const domainConfig: DomainConfig = {
  'localhost': {
    allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUB_OWNER', 'AGENT', 'USER'],
    redirectUrl: null
  },
  '127.0.0.1': {
    allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUB_OWNER', 'AGENT', 'USER'],
    redirectUrl: null
  },
  'admin.betting.com': {
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    redirectUrl: '/admin'
  },
  'agent.betting.com': {
    allowedRoles: ['AGENT', 'SUB_OWNER', 'ADMIN', 'SUPER_ADMIN'],
    redirectUrl: '/agent'
  },
  'client.betting.com': {
    allowedRoles: ['USER', 'AGENT', 'SUB_OWNER', 'ADMIN', 'SUPER_ADMIN'],
    redirectUrl: '/client'
  }
};

// Function to check if user should be redirected based on role and domain
export function checkDomainRedirect(userRole: string, currentDomain: string): boolean {
  const domainSettings = domainConfig[currentDomain];
  
  if (!domainSettings) {
    return false; // No domain restrictions
  }
  
  const hasAccess = domainSettings.allowedRoles.includes(userRole);
  return !hasAccess; // Return true if redirect is needed
}

// Function to handle domain authentication errors
export function handleDomainAuthError(error: any): boolean {
  // Check if this is a domain-related error
  if (error && typeof error === 'object') {
    // Handle specific domain auth errors here
    if (error.message && error.message.includes('domain')) {
      console.log('🔍 Domain auth error handled:', error.message);
      return true; // Error was handled
    }
  }
  return false; // Error was not handled
}

export function useDomainRedirect() {
  const { user, loading } = useUser();
  
  const checkDomainAccess = () => {
    if (loading || !user) {
      return { hasAccess: false, redirectUrl: '/login' };
    }
    
    const currentDomain = window.location.hostname;
    const domainSettings = domainConfig[currentDomain];
    
    if (!domainSettings) {
      return { hasAccess: true, redirectUrl: null };
    }
    
    const hasAccess = domainSettings.allowedRoles.includes(user.role);
    const redirectUrl = hasAccess ? null : domainSettings.redirectUrl || '/unauthorized';
    
    return { hasAccess, redirectUrl };
  };
  
  const redirectIfNeeded = () => {
    const { hasAccess, redirectUrl } = checkDomainAccess();
    
    if (!hasAccess && redirectUrl) {
      window.location.href = redirectUrl;
    }
  };
  
  return {
    checkDomainAccess,
    redirectIfNeeded,
    hasAccess: checkDomainAccess().hasAccess
  };
} 