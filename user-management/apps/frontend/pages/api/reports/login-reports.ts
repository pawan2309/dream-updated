import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

// Role-based access control middleware
function withRoleAuth(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get user session from cookies
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

      const userRole = decoded.user?.role;
      
      if (!userRole) {
        return res.status(401).json({ success: false, message: 'User role not found in session' });
      }

      // Check if user can access restricted sections (COMMISSIONS, OLD DATA, LOGIN REPORTS)
      // Only SUB_OWNER and above can access these sections
      const restrictedRoles = ['SUB_OWNER'];
      if (!restrictedRoles.includes(userRole)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied: Login Reports section is restricted to SUB_OWNER and above' 
        });
      }

      // Add user info to request for use in handler
      (req as any).user = decoded.user;

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

export default withRoleAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        type = 'daily', 
        role, 
        startDate, 
        endDate, 
        userId,
        page = '1',
        limit = '50'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build date filters
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate as string);
      }

      // Build where clause
      const whereClause: any = {};
      if (Object.keys(dateFilter).length > 0) {
        whereClause.loginAt = dateFilter;
      }
      if (userId) {
        whereClause.userId = userId;
      }
      if (role) {
        whereClause.user = {
          role: role as string
        };
      }

      let query: any = {
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
              code: true,
            },
          },
        },
        orderBy: {
          loginAt: 'desc',
        },
        skip,
        take: limitNum,
      };

      // Handle different report types
      switch (type) {
        case 'daily':
          // Today's logins
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          query.where.loginAt = {
            gte: today,
            lt: tomorrow,
          };
          break;

        case 'weekly':
          // This week's logins
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          
          query.where.loginAt = {
            gte: weekStart,
          };
          break;

        case 'monthly':
          // This month's logins
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          
          query.where.loginAt = {
            gte: monthStart,
          };
          break;

        case 'online':
          // Currently online users
          query.where.isActive = true;
          break;

        case 'session-duration':
          // Sessions with duration
          query.where.sessionDuration = {
            not: null,
          };
          break;

        default:
          // All logins (default)
          break;
      }

      // Get login sessions
      const [sessions, totalCount] = await Promise.all([
        prisma.loginSession.findMany(query),
        prisma.loginSession.count({ where: query.where }),
      ]);

      // Calculate additional statistics
      const stats = await calculateStats(type as string, query.where, role as string);

      res.status(200).json({
        success: true,
        data: sessions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
        stats,
      });
    } catch (error) {
      console.error('Error fetching login reports:', error);
      res.status(500).json({ error: 'Failed to fetch login reports' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});

async function calculateStats(type: string, whereClause: any, role?: string) {
  try {
    const [
      totalLogins,
      activeSessions,
      avgSessionDuration,
      deviceStats,
      roleStats,
    ] = await Promise.all([
      // Total logins
      prisma.loginSession.count({ where: whereClause }),
      
      // Active sessions
      prisma.loginSession.count({ 
        where: { ...whereClause, isActive: true } 
      }),
      
      // Average session duration
      prisma.loginSession.aggregate({
        where: { 
          ...whereClause, 
          sessionDuration: { not: null } 
        },
        _avg: { sessionDuration: true },
      }),
      
      // Device type statistics
      prisma.loginSession.groupBy({
        by: ['deviceType'],
        where: whereClause,
        _count: { deviceType: true },
      }),
      
      // Role-based statistics
      prisma.loginSession.groupBy({
        by: ['userId'],
        where: whereClause,
        _count: { userId: true },
      }),
    ]);

    return {
      totalLogins,
      activeSessions,
      avgSessionDuration: avgSessionDuration._avg.sessionDuration || 0,
      deviceStats: deviceStats.reduce((acc: any, item: any) => {
        acc[item.deviceType || 'unknown'] = item._count.deviceType;
        return acc;
      }, {}),
      roleStats: roleStats.reduce((acc: any, item: any) => {
        // For role-specific queries, we need to get the user's role
        acc[role as string || 'unknown'] = item._count.userId;
        return acc;
      }, {}),
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {};
  }
} 