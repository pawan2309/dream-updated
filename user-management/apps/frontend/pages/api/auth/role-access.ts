import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { 
  getRoleBasedNavigation, 
  getAccessibleRoles, 
  canAccessFeature,
  canAccessRole 
} from '../../../lib/hierarchyUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

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
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not found in session' });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    // Get role-based access information
    const accessibleRoles = getAccessibleRoles(user.role);
    const navigation = getRoleBasedNavigation(user.role);
    
    // Check specific feature access
    const featureAccess = {
      login_reports: canAccessFeature(user.role, 'login_reports'),
      super_admin_management: canAccessFeature(user.role, 'super_admin_management'),
      admin_management: canAccessFeature(user.role, 'admin_management'),
      sub_owner_management: canAccessFeature(user.role, 'sub_owner_management'),
      sub_management: canAccessFeature(user.role, 'sub_management'),
      master_management: canAccessFeature(user.role, 'master_management'),
      super_agent_management: canAccessFeature(user.role, 'super_agent_management'),
      agent_management: canAccessFeature(user.role, 'agent_management'),
      client_management: canAccessFeature(user.role, 'client_management'),
    };

    // Get accessible users by role (for hierarchy filtering)
    const accessibleUsersByRole: Record<string, any[]> = {};
    
    for (const role of accessibleRoles) {
      try {
        const users = await prisma.user.findMany({
          where: {
            role: role as any,
            isActive: true
          },
          select: {
            id: true,
            username: true,
            name: true,
            code: true,
            role: true
          },
          orderBy: {
            name: 'asc'
          }
        });
        
        accessibleUsersByRole[role] = users;
      } catch (error) {
        console.error(`Error fetching users for role ${role}:`, error);
        accessibleUsersByRole[role] = [];
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      access: {
        accessibleRoles,
        navigation,
        featureAccess,
        accessibleUsersByRole
      }
    });

  } catch (error) {
    console.error('Error in role-access API:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: (error as Error).message 
    });
  }
} 