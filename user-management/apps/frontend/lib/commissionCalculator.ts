import { prisma } from './prisma';

export interface CommissionConfig {
  share: number;
  matchcommission: number;
  sessioncommission: number;
  mobileshare: number;
  casinocommission: number;
  cshare: number;
  icshare: number;
}

export interface BetResult {
  betId: string;
  userId: string;
  stake: number;
  potentialWin: number;
  result: 'WON' | 'LOST';
  profit: number;
  matchId: string;
}

export interface CommissionDistribution {
  userId: string;
  userRole: string;
  commissionType: string;
  percentage: number;
  amount: number;
  betId: string;
}

export class CommissionCalculator {
  /**
   * Calculate commission distribution for a bet result
   */
  static async calculateCommissions(betResult: BetResult): Promise<CommissionDistribution[]> {
    const distributions: CommissionDistribution[] = [];
    
    try {
      // Get the user who placed the bet
      const betUser = await prisma.user.findUnique({
        where: { id: betResult.userId },
        include: { parent: true }
      });

      if (!betUser) {
        throw new Error('Bet user not found');
      }

      // Calculate profit (positive for wins, negative for losses)
      const profit = betResult.result === 'WON' 
        ? betResult.potentialWin - betResult.stake 
        : -betResult.stake;

      // Only distribute commissions if there's a profit (winning bet)
      if (profit <= 0) {
        return distributions;
      }

      // Get the hierarchy chain for commission distribution
      const hierarchy = await this.getUserHierarchy(betUser.id);
      
      // Distribute commissions up the hierarchy
      for (const user of hierarchy) {
        const userCommissions = await this.calculateUserCommissions(user, profit, betResult.betId);
        distributions.push(...userCommissions);
      }

    } catch (error) {
      console.error('Error calculating commissions:', error);
      throw error;
    }

    return distributions;
  }

  /**
   * Get the complete hierarchy chain for a user
   */
  private static async getUserHierarchy(userId: string): Promise<any[]> {
    const hierarchy: any[] = [];
    let currentUserId = userId;

    while (currentUserId) {
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { parent: true }
      });

      if (!user) break;

      hierarchy.push(user);
      currentUserId = user.parentId || '';
    }

    return hierarchy;
  }

  /**
   * Calculate commissions for a specific user
   */
  private static async calculateUserCommissions(user: any, profit: number, betId: string): Promise<CommissionDistribution[]> {
    const distributions: CommissionDistribution[] = [];

    // Basic share commission
    if (user.share && user.share > 0) {
      distributions.push({
        userId: user.id,
        userRole: user.role,
        commissionType: 'SHARE',
        percentage: user.share,
        amount: (profit * user.share) / 100,
        betId
      });
    }

    // Match commission
    if (user.matchcommission && user.matchcommission > 0) {
      distributions.push({
        userId: user.id,
        userRole: user.role,
        commissionType: 'MATCH_COMMISSION',
        percentage: user.matchcommission,
        amount: (profit * user.matchcommission) / 100,
        betId
      });
    }

    // Session commission
    if (user.sessioncommission && user.sessioncommission > 0) {
      distributions.push({
        userId: user.id,
        userRole: user.role,
        commissionType: 'SESSION_COMMISSION',
        percentage: user.sessioncommission,
        amount: (profit * user.sessioncommission) / 100,
        betId
      });
    }

    // Mobile share
    if (user.mobileshare && user.mobileshare > 0) {
      distributions.push({
        userId: user.id,
        userRole: user.role,
        commissionType: 'MOBILE_SHARE',
        percentage: user.mobileshare,
        amount: (profit * user.mobileshare) / 100,
        betId
      });
    }

    return distributions;
  }

  /**
   * Create profit distribution records and update ledgers
   */
  static async processCommissions(distributions: CommissionDistribution[]): Promise<void> {
    try {
      for (const distribution of distributions) {
        // Create profit distribution record
        await prisma.profitDistribution.create({
          data: {
            betId: distribution.betId,
            userId: distribution.userId,
            profitShare: distribution.percentage,
            amountEarned: distribution.amount
          }
        });

        // Create ledger entry for commission
        // await prisma.ledger.create({
        //   data: {
        //     userId: distribution.userId,
        //     collection: `Commission - ${distribution.commissionType}`,
        //     credit: distribution.amount,
        //     debit: 0,
        //     balanceAfter: 0, // Will be calculated
        //     type: 'WIN',
        //     remark: `Commission from bet ${distribution.betId}`,
        //     referenceId: distribution.betId,
        //     transactionType: 'COMMISSION'
        //   }
        // });
      }
    } catch (error) {
      console.error('Error processing commissions:', error);
      throw error;
    }
  }

  /**
   * Calculate total commissions earned by a user
   */
  static async getUserTotalCommissions(userId: string, startDate?: Date, endDate?: Date): Promise<number> {
    const whereClause: any = { userId };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    const distributions = await prisma.profitDistribution.findMany({
      where: whereClause
    });

    return distributions.reduce((total, dist) => total + dist.amountEarned, 0);
  }

  /**
   * Get commission summary for a user
   */
  static async getUserCommissionSummary(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get total commissions earned
    const totalCommissions = await this.getUserTotalCommissions(userId);

    // Get commission breakdown by type
    const commissionBreakdown = await prisma.profitDistribution.groupBy({
      by: ['profitShare'],
      where: { userId },
      _sum: {
        amountEarned: true
      }
    });

    return {
      userId,
      userRole: user.role,
      commissionConfig: {
        share: user.share || 0,
        matchcommission: user.matchcommission || 0,
        sessioncommission: user.sessioncommission || 0,
        mobileshare: user.mobileshare || 0,
        casinocommission: user.casinocommission || 0,
        cshare: user.cshare || 0,
        icshare: user.icshare || 0
      },
      totalCommissions,
      commissionBreakdown
    };
  }
} 