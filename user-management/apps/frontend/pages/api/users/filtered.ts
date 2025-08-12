import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getAccessibleRoles, canAccessRole } from '../../../lib/hierarchyUtils';

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

    // Get current user's role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true
      }
    });

    if (!currentUser || !currentUser.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    // Get query parameters
    const { role, parentId, includeInactive } = req.query;
    
    // Get accessible roles for current user
    const accessibleRoles = getAccessibleRoles(currentUser.role);
    
    // Build where clause
    let whereClause: any = {};
    
    // Filter by role if specified and accessible
    if (role && typeof role === 'string') {
      if (!accessibleRoles.includes(role)) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied: Cannot view ${role} users` 
        });
      }
      whereClause.role = role as any;
    } else {
      // If no specific role requested, only show accessible roles
      whereClause.role = { in: accessibleRoles.map(r => r as any) };
    }
    
    // Filter by parentId if specified
    if (parentId && typeof parentId === 'string') {
      whereClause.parentId = parentId;
    }
    
    // Filter by active status
    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    // Get users with hierarchy information
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        balance: true,
        creditLimit: true,
        isActive: true,
        createdAt: true,
        code: true,
        contactno: true,
        share: true,
        matchCommission: true,
        sessionCommission: true,
        parentId: true,
        parent: {
          select: {
            id: true,
            username: true,
            name: true,
            code: true,
            role: true
          }
        },
        children: {
          select: {
            id: true,
            username: true,
            name: true,
            code: true,
            role: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });

    // Add hierarchy level information
    const usersWithHierarchy = users.map(user => ({
      ...user,
      hierarchyLevel: accessibleRoles.indexOf(user.role),
      canManage: canAccessRole(currentUser.role, user.role),
      directChildren: user.children.length,
      totalChildren: user.children.length // You can add recursive counting here if needed
    }));

    return res.status(200).json({
      success: true,
      currentUser: {
        id: currentUser.id,
        role: currentUser.role
      },
      accessibleRoles,
      users: usersWithHierarchy,
      total: usersWithHierarchy.length
    });

  } catch (error) {
    console.error('Error in filtered users API:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: (error as Error).message 
    });
  }
} 