import { getPrimaryDomain, shouldRedirect } from './domainAccess';

/**
 * Check if user should be redirected based on their role
 */
export function checkDomainRedirect(userRole: string, currentDomain: string) {
  // TEMPORARILY DISABLED FOR DEVELOPMENT
  // In development, we want to stay on localhost
  console.log('🔧 Domain redirect check disabled for development');
  console.log('🔧 User role:', userRole);
  console.log('🔧 Current domain:', currentDomain);
  return false;
  
  // Original code (commented out for development):
  /*
  const redirectInfo = shouldRedirect(userRole as any, currentDomain);
  
  if (redirectInfo.shouldRedirect) {
    // Redirect to appropriate domain
    const protocol = window.location.protocol;
    const targetUrl = `${protocol}//${redirectInfo.targetDomain}${window.location.pathname}${window.location.search}`;
    
    window.location.href = targetUrl;
    return true;
  }
  
  return false;
  */
}

/**
 * Validate if current domain is correct for user role
 */
export function validateCurrentDomain(userRole: string): boolean {
  // TEMPORARILY DISABLED FOR DEVELOPMENT
  console.log('🔧 Domain validation disabled for development');
  return true;
  
  // Original code (commented out for development):
  /*
  const currentDomain = window.location.hostname;
  const primaryDomain = getPrimaryDomain(userRole as any);
  
  return currentDomain === primaryDomain;
  */
}

/**
 * Get the correct domain for a user role
 */
export function getCorrectDomain(userRole: string): string {
  return getPrimaryDomain(userRole as any);
}

/**
 * Handle domain-based authentication errors
 */
export function handleDomainAuthError(error: any) {
  // TEMPORARILY DISABLED FOR DEVELOPMENT
  console.log('🔧 Domain auth error handling disabled for development');
  return false;
  
  // Original code (commented out for development):
  /*
  if (error?.redirectTo) {
    const protocol = window.location.protocol;
    const targetUrl = `${protocol}//${error.redirectTo}${window.location.pathname}`;
    window.location.href = targetUrl;
    return true;
  }
  
  return false;
  */
} 