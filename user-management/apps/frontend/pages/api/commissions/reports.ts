import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { CommissionCalculator } from '../../../lib/commissionCalculator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId, startDate, endDate, role } = req.query;

    // Get commission reports based on filters
    if (userId) {
      // Individual user commission report
      const report = await getUserCommissionReport(userId as string, startDate as string, endDate as string);
      return res.status(200).json({ success: true, data: report });
    } else if (role) {
      // Role-based commission report
      const report = await getRoleCommissionReport(role as string, startDate as string, endDate as string);
      return res.status(200).json({ success: true, data: report });
    } else {
      // Overall commission report
      const report = await getOverallCommissionReport(startDate as string, endDate as string);
      return res.status(200).json({ success: true, data: report });
    }

  } catch (error) {
    console.error('Error generating commission report:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get commission report for a specific user
 */
async function getUserCommissionReport(userId: string, startDate?: string, endDate?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const whereClause: any = { userId };
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  // Get commission distributions
  const distributions = await prisma.profitDistribution.findMany({
    where: whereClause,
    include: {
      bet: {
        include: {
          match: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get commission summary
  const summary = await CommissionCalculator.getUserCommissionSummary(userId);

  // Calculate daily commission breakdown
  const dailyBreakdown = await prisma.profitDistribution.groupBy({
    by: ['createdAt'],
    where: whereClause,
    _sum: {
      amountEarned: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      code: user.code
    },
    summary,
    distributions,
    dailyBreakdown,
    totalCommissions: distributions.reduce((sum, dist) => sum + dist.amountEarned, 0),
    totalBets: distributions.length
  };
}

/**
 * Get commission report for a specific role
 */
async function getRoleCommissionReport(role: string, startDate?: string, endDate?: string) {
  const whereClause: any = {};
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  // Get all users with the specified role
  const users = await prisma.user.findMany({
    where: { role: role as any },
    include: {
      profitDistributions: {
        where: whereClause
      }
    }
  });

  // Calculate role summary
  const roleSummary = users.map(user => ({
    userId: user.id,
    username: user.username,
    name: user.name,
    code: user.code,
    totalCommissions: user.profitDistributions.reduce((sum, dist) => sum + dist.amountEarned, 0),
    totalBets: user.profitDistributions.length,
    commissionConfig: {
      share: user.share || 0,
      matchcommission: user.matchcommission || 0,
      sessioncommission: user.sessioncommission || 0,
      mobileshare: user.mobileshare || 0
    }
  }));

  const totalRoleCommissions = roleSummary.reduce((sum, user) => sum + user.totalCommissions, 0);
  const totalRoleBets = roleSummary.reduce((sum, user) => sum + user.totalBets, 0);

  return {
    role,
    totalUsers: users.length,
    totalCommissions: totalRoleCommissions,
    totalBets: totalRoleBets,
    averageCommissionPerUser: users.length > 0 ? totalRoleCommissions / users.length : 0,
    users: roleSummary
  };
}

/**
 * Get overall commission report
 */
async function getOverallCommissionReport(startDate?: string, endDate?: string) {
  const whereClause: any = {};
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  // Get overall statistics
  const totalCommissions = await prisma.profitDistribution.aggregate({
    where: whereClause,
    _sum: {
      amountEarned: true
    },
    _count: true
  });

  // Get commission breakdown by role
  const roleBreakdown = await prisma.profitDistribution.groupBy({
    by: ['userId'],
    where: whereClause,
    _sum: {
      amountEarned: true
    }
  });

  // Get user details for role breakdown
  const userIds = roleBreakdown.map(item => item.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, role: true }
  });

  const roleSummary = users.reduce((acc, user) => {
    const userCommissions = roleBreakdown.find(item => item.userId === user.id);
    if (userCommissions) {
      if (!acc[user.role]) {
        acc[user.role] = { total: 0, users: 0 };
      }
      acc[user.role].total += userCommissions._sum.amountEarned || 0;
      acc[user.role].users += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; users: number }>);

  // Get daily commission trend
  const dailyTrend = await prisma.profitDistribution.groupBy({
    by: ['createdAt'],
    where: whereClause,
    _sum: {
      amountEarned: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    totalCommissions: totalCommissions._sum.amountEarned || 0,
    totalDistributions: totalCommissions._count || 0,
    roleBreakdown: roleSummary,
    dailyTrend,
    period: {
      startDate: startDate || 'All time',
      endDate: endDate || 'All time'
    }
  };
} 