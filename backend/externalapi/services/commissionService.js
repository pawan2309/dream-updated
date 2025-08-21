const database = require('../utils/database');
const logger = require('../utils/logger');

/**
 * Commission Service for calculating and distributing betting commissions
 */
class CommissionService {
  
  /**
   * Get user commission rate
   * @param {string} userId - User ID
   * @returns {Object} Commission information
   */
  static async getUserCommissionRate(userId) {
    try {
      const user = await database.findOne('User', { id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Get commission share data
      const commissionShare = await database.findOne('UserCommissionShare', { userId: userId });
      
      if (!commissionShare) {
        // Default commission rate if not set
        return {
          matchCommission: 5.0, // Default 5%
          sessionCommission: 0.0,
          casinoCommission: 0.0,
          commissionType: 'PERCENTAGE'
        };
      }

      return {
        matchCommission: commissionShare.matchcommission || 5.0,
        sessionCommission: commissionShare.sessioncommission || 0.0,
        casinoCommission: commissionShare.casinocommission || 0.0,
        commissionType: commissionShare.commissionType || 'PERCENTAGE'
      };
    } catch (error) {
      logger.error('Error getting user commission rate:', error);
      throw error;
    }
  }

  /**
   * Calculate commission for a winning bet
   * @param {string} userId - User ID
   * @param {number} winnings - Bet winnings amount
   * @param {string} betType - Type of bet (match, session, casino)
   * @returns {Object} Commission calculation result
   */
  static async calculateCommission(userId, winnings, betType = 'match') {
    try {
      if (winnings <= 0) {
        return {
          commissionAmount: 0,
          netWinnings: winnings,
          commissionRate: 0
        };
      }

      const commissionRates = await this.getUserCommissionRate(userId);
      let commissionRate = 0;

      switch (betType) {
        case 'match':
          commissionRate = commissionRates.matchCommission;
          break;
        case 'session':
          commissionRate = commissionRates.sessionCommission;
          break;
        case 'casino':
          commissionRate = commissionRates.casinoCommission;
          break;
        default:
          commissionRate = commissionRates.matchCommission;
      }

      const commissionAmount = (winnings * commissionRate) / 100;
      const netWinnings = winnings - commissionAmount;

      return {
        commissionAmount: Math.round(commissionAmount * 100) / 100, // Round to 2 decimal places
        netWinnings: Math.round(netWinnings * 100) / 100,
        commissionRate: commissionRate,
        grossWinnings: winnings
      };
    } catch (error) {
      logger.error('Error calculating commission:', error);
      throw error;
    }
  }

  /**
   * Apply commission to user balance
   * @param {string} userId - User ID
   * @param {number} commissionAmount - Commission amount to deduct
   * @param {Object} client - Database transaction client
   * @returns {Object} Updated balance information
   */
  static async applyCommission(userId, commissionAmount, client = null) {
    try {
      if (commissionAmount <= 0) {
        return { commissionApplied: false, amount: 0 };
      }

      const db = client || database;
      
      const user = await db.findOne('User', { id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // No balance update needed - only track commission
      await db.update('User', { id: userId }, {
        updatedAt: new Date()
      });

      // Create ledger entry for commission
      const ledgerData = {
        id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        collection: 'COMMISSION',
        debit: commissionAmount,
        credit: 0,

        type: 'COMMISSION',
        remark: `Commission deducted from winnings`,
        transactionType: 'COMMISSION',
        createdAt: new Date()
      };

      await db.insert('Ledger', ledgerData);

      return {
        commissionApplied: true,
        amount: commissionAmount
      };
    } catch (error) {
      logger.error('Error applying commission:', error);
      throw error;
    }
  }

  /**
   * Calculate net P&L for a user in a specific match
   * @param {string} userId - User ID
   * @param {string} matchId - Match ID
   * @returns {Object} P&L calculation result
   */
  static async calculateUserMatchPNL(userId, matchId) {
    try {
      // Get all bets for user in this match
      const bets = await database.findMany('Bet', {
        userId: userId,
        matchId: matchId
      });

      let totalStakes = 0;
      let totalWinnings = 0;
      let totalLosses = 0;
      let grossProfit = 0;
      let netProfit = 0;
      let totalCommission = 0;

      for (const bet of bets) {
        if (bet.status === 'WON') {
          totalWinnings += bet.wonAmount || 0;
          totalStakes += bet.stake;
        } else if (bet.status === 'LOST') {
          totalLosses += bet.stake;
        }
      }

      grossProfit = totalWinnings - totalStakes;
      
      if (grossProfit > 0) {
        // Calculate commission on gross profit
        const commissionResult = await this.calculateCommission(userId, grossProfit, 'match');
        totalCommission = commissionResult.commissionAmount;
        netProfit = commissionResult.netWinnings;
      } else {
        netProfit = grossProfit;
      }

      return {
        userId,
        matchId,
        totalStakes,
        totalWinnings,
        totalLosses,
        grossProfit: Math.round(grossProfit * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        betCount: bets.length
      };
    } catch (error) {
      logger.error('Error calculating user match P&L:', error);
      throw error;
    }
  }

  /**
   * Distribute profit/loss up the user hierarchy
   * @param {string} userId - User ID
   * @param {number} amount - Amount to distribute (positive for profit, negative for loss)
   * @param {string} matchId - Match ID for reference
   * @param {Object} client - Database transaction client
   * @returns {Object} Distribution result
   */
  static async distributeProfitLoss(userId, amount, matchId, client = null) {
    try {
      const db = client || database;
      
      // Get user hierarchy
      let currentUser = await db.findOne('User', { id: userId });
      if (!currentUser) {
        throw new Error('User not found');
      }

      let remaining = Math.abs(amount);
      let direction = amount > 0 ? 1 : -1; // 1: profit, -1: loss
      let parentId = currentUser.parentId;
      let distributionLog = [];

      while (parentId && remaining > 0.0001) {
        const parent = await db.findOne('User', { id: parentId });
        if (!parent) break;

        // Get parent's share percentage
        const commissionShare = await db.findOne('UserCommissionShare', { userId: parentId });
        const share = commissionShare ? (commissionShare.share || 0) : 0;
        
        if (share > 0) {
          const shareAmount = (remaining * share) / 100;
          
          if (shareAmount > 0) {
            // Update parent balance
            const newParentBalance = parent.balance + (direction > 0 ? shareAmount : -shareAmount);
            await db.update('User', { id: parentId }, {
              balance: newParentBalance,
              updatedAt: new Date()
            });

            // Create ledger entry
            const ledgerData = {
              id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: parentId,
              sourceUserId: currentUser.id,
              matchId: matchId,
              collection: direction > 0 ? 'PNL_CREDIT' : 'PNL_DEBIT',
              credit: direction > 0 ? shareAmount : 0,
              debit: direction < 0 ? shareAmount : 0,
              balanceAfter: newParentBalance,
              type: direction > 0 ? 'PNL_CREDIT' : 'PNL_DEBIT',
              remark: direction > 0 ? 'Profit from downline' : 'Loss to downline',
              transactionType: 'P&L',
              referenceId: matchId,
              createdAt: new Date()
            };

            await db.insert('Ledger', ledgerData);

            distributionLog.push({
              userId: parentId,
              share: share,
              amount: shareAmount,
              newBalance: newParentBalance
            });

            remaining -= shareAmount;
          }
        }

        // Move up hierarchy
        currentUser = parent;
        parentId = parent.parentId;
      }

      // If any remaining, assign to topmost upline
      if (remaining > 0.0001 && currentUser) {
        // No balance update needed for topmost upline
        await db.update('User', { id: currentUser.id }, {
          updatedAt: new Date()
        });

        const ledgerData = {
          id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: currentUser.id,
          sourceUserId: userId,
          matchId: matchId,
          collection: direction > 0 ? 'PNL_CREDIT' : 'PNL_DEBIT',
          credit: direction > 0 ? remaining : 0,
          debit: direction < 0 ? remaining : 0,

          type: direction > 0 ? 'PNL_CREDIT' : 'PNL_DEBIT',
          remark: 'Topmost upline allocation',
          transactionType: 'P&L',
          referenceId: matchId,
          createdAt: new Date()
        };

        await db.insert('Ledger', ledgerData);

        distributionLog.push({
          userId: currentUser.id,
          share: 100,
          amount: remaining,
          isTopmost: true
        });
      }

      return {
        success: true,
        originalAmount: amount,
        distributedAmount: Math.abs(amount) - remaining,
        remainingAmount: remaining,
        distributionLog: distributionLog
      };

    } catch (error) {
      logger.error('Error distributing profit/loss:', error);
      throw error;
    }
  }

  /**
   * Get commission summary for a user
   * @param {string} userId - User ID
   * @returns {Object} Commission summary
   */
  static async getCommissionSummary(userId) {
    try {
      const commissionRates = await this.getUserCommissionRate(userId);
      
      // Get recent commission transactions
      const recentCommissions = await database.findMany('Ledger', {
        userId: userId,
        type: 'COMMISSION',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });

      const totalCommission = recentCommissions.reduce((sum, ledger) => sum + ledger.debit, 0);

      return {
        userId,
        commissionRates,
        totalCommission: Math.round(totalCommission * 100) / 100,
        recentCommissions: recentCommissions.length,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error getting commission summary:', error);
      throw error;
    }
  }
}

module.exports = CommissionService;
