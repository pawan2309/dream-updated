import { NextApiRequest, NextApiResponse } from 'next';
import { canAccessFeature, canAccessRole } from '../hierarchyUtils';

export interface RoleAuthOptions {
  requiredFeature?: string;
  requiredRole?: string;
  allowSameRole?: boolean;
}

export function withRoleAuth(handler: any, options: RoleAuthOptions = {}) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get user session
      const session = req.cookies['betx_session'];
      if (!session) {
        return res.status(401).json({ success: false, message: 'No session found' });
      }

      // Verify session
      const jwt = require('jsonwebtoken');
      let decoded;
      try {
        decoded = jwt.verify(session, process.env.JWT_SECRET || 'dev_secret');
      } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid session' });
      }

      const userId = decoded.user?.id;
      const userRole = decoded.user?.role;
      
      if (!userId || !userRole) {
        return res.status(401).json({ success: false, message: 'User not found in session' });
      }

      // Check feature access if required
      if (options.requiredFeature) {
        if (!canAccessFeature(userRole, options.requiredFeature)) {
          return res.status(403).json({ 
            success: false, 
            message: `Access denied: Feature '${options.requiredFeature}' not available for role '${userRole}'` 
          });
        }
      }

      // Check role access if required
      if (options.requiredRole) {
        const hasAccess = canAccessRole(userRole, options.requiredRole) || 
                         (options.allowSameRole && userRole === options.requiredRole);
        
        if (!hasAccess) {
          return res.status(403).json({ 
            success: false, 
            message: `Access denied: Cannot access role '${options.requiredRole}' with role '${userRole}'` 
          });
        }
      }

      // Add user info to request for use in handler
      (req as any).user = {
        id: userId,
        role: userRole,
        ...decoded.user
      };

      // Call the original handler
      return handler(req, res);

    } catch (error) {
      console.error('Role auth middleware error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: (error as Error).message 
      });
    }
  };
}

// Helper function to check if user can access a specific route
export function canAccessRoute(userRole: string, route: string): boolean {
  // Special handling for SUB_OWNER - give access to all routes
  if (userRole === 'SUB_OWNER') {
    return true;
  }
  
  // Check if this is a restricted section route
  const isRestrictedSection = route.includes('/commissions') || 
                             route.includes('/reports/login-reports') || 
                             route.includes('/old-data');
  
  if (isRestrictedSection) {
    // Only SUB_OWNER can access restricted sections
    return false;
  }
  
  const routeAccessMap: Record<string, string[]> = {
    // Super Admin routes - only accessible to roles above SUPER_ADMIN
    '/user_details/super_admin': ['SUB_OWNER'],
    '/ct/super_admin': ['SUB_OWNER'],
    '/ledger/super_admin': ['SUB_OWNER'],
    
    // Admin routes - only accessible to roles above ADMIN
    '/user_details/admin': ['SUB_OWNER'],
    '/ct/admin': ['SUB_OWNER'],
    '/ledger/admin': ['SUB_OWNER'],
    
    // Sub Owner routes - only accessible to roles above SUB_OWNER
    '/user_details/sub_owner': ['SUB_OWNER'],
    '/ct/sub_owner': ['SUB_OWNER'],
    '/ledger/sub_owner': ['SUB_OWNER'],
    
    // Sub Agent routes - only accessible to roles above SUB
    '/user_details/sub': ['SUB_OWNER'],
    '/ct/sub': ['SUB_OWNER'],
    '/ledger/sub': ['SUB_OWNER'],
    
    // Master Agent routes - only accessible to roles above MASTER
    '/user_details/master': ['SUB', 'SUB_OWNER'],
    '/ct/master': ['SUB', 'SUB_OWNER'],
    '/ledger/master': ['SUB', 'SUB_OWNER'],
    
    // Super Agent routes - only accessible to roles above SUPER_AGENT
    '/user_details/super': ['MASTER', 'SUB', 'SUB_OWNER'],
    '/ct/super': ['MASTER', 'SUB', 'SUB_OWNER'],
    '/ledger/super': ['MASTER', 'SUB', 'SUB_OWNER'],
    
    // Agent routes - only accessible to roles above AGENT
    '/user_details/agent': ['SUPER_AGENT', 'MASTER', 'SUB', 'SUB_OWNER'],
    '/ct/agent': ['SUPER_AGENT', 'MASTER', 'SUB', 'SUB_OWNER'],
    '/ledger/agent': ['SUPER_AGENT', 'MASTER', 'SUB', 'SUB_OWNER'],
    
    // Client routes - only accessible to roles above USER
    '/user_details/client': ['AGENT', 'SUPER_AGENT', 'MASTER', 'SUB', 'SUB_OWNER'],
    '/ct/client': ['AGENT', 'SUPER_AGENT', 'MASTER', 'SUB', 'SUB_OWNER'],
    '/ledger/client': ['AGENT', 'SUPER_AGENT', 'MASTER', 'SUB', 'SUB_OWNER'],
    
    // Game routes - accessible to all authenticated users
    '/game/inPlay': ['USER', 'AGENT', 'SUPER_AGENT', 'MASTER', 'SUB', 'SUB_OWNER'],
    '/game/completeGame': ['USER', 'AGENT', 'SUPER_AGENT', 'MASTER', 'SUB', 'SUB_OWNER'],
  };

  const allowedRoles = routeAccessMap[route] || [];
  return allowedRoles.includes(userRole);
}

// Helper function to get accessible routes for a user
export function getAccessibleRoutes(userRole: string): string[] {
  const allRoutes = [
    '/user_details/super_admin',
    '/user_details/admin',
    '/user_details/sub_owner',
    '/user_details/sub',
    '/user_details/master',
    '/user_details/super',
    '/user_details/agent',
    '/user_details/client',
    '/ct/super_admin',
    '/ct/admin',
    '/ct/sub_owner',
    '/ct/sub',
    '/ct/master',
    '/ct/super',
    '/ct/agent',
    '/ct/client',
    '/ledger/super_admin',
    '/ledger/admin',
    '/ledger/sub_owner',
    '/ledger/sub',
    '/ledger/master',
    '/ledger/super',
    '/ledger/agent',
    '/ledger/client',
    '/reports/login-reports',
    '/game/inPlay',
    '/game/completeGame',
    '/commissions',
  ];

  // Special handling for SUB_OWNER - return all routes
  if (userRole === 'SUB_OWNER') {
    return allRoutes;
  }

  return allRoutes.filter(route => canAccessRoute(userRole, route));
} 