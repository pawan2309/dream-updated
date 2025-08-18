const database = require('../utils/database');
const logger = require('../utils/logger');

/**
 * Exposure Service for calculating and managing bet exposure
 */
class ExposureService {
  
  /**
   * Calculate exposure for a bet based on type and odds
   * @param {string} betType - 'back' or 'lay'
   * @param {number} stake - Bet stake amount
   * @param {number} odds - Bet odds
   * @returns {number} Calculated exposure amount
   */
  static calculateBetExposure(betType, stake, odds) {
    try {
      if (betType === 'back') {
        // For back bets: exposure = stake
        return stake;
      } else if (betType === 'lay') {
        // For lay bets: exposure = stake × (odds - 1)
        return stake * (odds - 1);
      } else {
        throw new Error(`Invalid bet type: ${betType}`);
      }
    } catch (error) {
      logger.error('Error calculating bet exposure:', error);
      throw error;
    }
  }

  /**
   * Calculate potential win/loss for a bet
   * @param {string} betType - 'back' or 'lay'
   * @param {number} stake - Bet stake amount
   * @param {number} odds - Bet odds
   * @returns {Object} Object containing potentialWin and potentialLoss
   */
  static calculatePotentialOutcomes(betType, stake, odds) {
    try {
      if (betType === 'back') {
        // For back bets:
        // - Win: stake × (odds - 1)
        // - Loss: stake
        return {
          potentialWin: (odds - 1) * stake,
          potentialLoss: stake
        };
      } else if (betType === 'lay') {
        // For lay bets:
        // - Win: stake
        // - Loss: stake × (odds - 1)
        return {
          potentialWin: stake,
          potentialLoss: (odds - 1) * stake
        };
      } else {
        throw new Error(`Invalid bet type: ${betType}`);
      }
    } catch (error) {
      logger.error('Error calculating potential outcomes:', error);
      throw error;
    }
  }

  /**
   * Update user balance and exposure after bet placement
   * @param {string} userId - User ID
   * @param {number} stake - Bet stake
   * @param {number} betExposure - Calculated bet exposure
   * @param {Object} client - Database transaction client
   * @returns {Object} Updated balance and exposure
   */
  static async updateUserBalanceAndExposure(userId, stake, betExposure, client = null) {
    try {
      const db = client || database;
      
      // Get current user data
      const user = await db.findOne('User', { id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      const currentBalance = user.balance || 0;
      const currentExposure = user.exposure || 0;

      // Calculate new values
      const newBalance = currentBalance - stake;
      const newExposure = currentExposure + betExposure;

      // Update user
      await db.update('User', { id: userId }, {
        balance: newBalance,
        exposure: newExposure,
        updatedAt: new Date()
      });

      return {
        previousBalance: currentBalance,
        newBalance: newBalance,
        previousExposure: currentExposure,
        newExposure: newExposure,
        stake: stake,
        betExposure: betExposure
      };
    } catch (error) {
      logger.error('Error updating user balance and exposure:', error);
      throw error;
    }
  }

  /**
   * Revert user balance and exposure after bet cancellation
   * @param {string} userId - User ID
   * @param {number} stake - Bet stake to refund
   * @param {number} betExposure - Bet exposure to remove
   * @param {Object} client - Database transaction client
   * @returns {Object} Updated balance and exposure
   */
  static async revertUserBalanceAndExposure(userId, stake, betExposure, client = null) {
    try {
      const db = client || database;
      
      // Get current user data
      const user = await db.findOne('User', { id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      const currentBalance = user.balance || 0;
      const currentExposure = user.exposure || 0;

      // Calculate new values
      const newBalance = currentBalance + stake;
      const newExposure = Math.max(0, currentExposure - betExposure);

      // Update user
      await db.update('User', { id: userId }, {
        balance: newBalance,
        exposure: newExposure,
        updatedAt: new Date()
      });

      return {
        previousBalance: currentBalance,
        newBalance: newBalance,
        previousExposure: currentExposure,
        newExposure: newExposure,
        refundedStake: stake,
        removedExposure: betExposure
      };
    } catch (error) {
      logger.error('Error reverting user balance and exposure:', error);
      throw error;
    }
  }

  /**
   * Calculate total exposure for a user across all markets
   * @param {string} userId - User ID
   * @returns {Object} Total exposure breakdown
   */
  static async calculateTotalUserExposure(userId) {
    try {
      // Get all pending bets for user
      const pendingBets = await database.findMany('Bet', {
        userId: userId,
        status: 'PENDING'
      });

      let totalExposure = 0;
      let marketExposure = {};
      let betTypeBreakdown = { back: 0, lay: 0 };

      for (const bet of pendingBets) {
        const betExposure = this.calculateBetExposure(bet.type, bet.stake, bet.odds);
        totalExposure += betExposure;

        // Track by market
        if (!marketExposure[bet.marketId]) {
          marketExposure[bet.marketId] = 0;
        }
        marketExposure[bet.marketId] += betExposure;

        // Track by bet type
        betTypeBreakdown[bet.type] += betExposure;
      }

      return {
        totalExposure,
        marketExposure,
        betTypeBreakdown,
        betCount: pendingBets.length
      };
    } catch (error) {
      logger.error('Error calculating total user exposure:', error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient balance for new bet
   * @param {string} userId - User ID
   * @param {number} stake - Required stake
   * @param {number} additionalExposure - Additional exposure from new bet
   * @returns {Object} Balance sufficiency check result
   */
  static async checkBalanceSufficiency(userId, stake, additionalExposure) {
    try {
      const user = await database.findOne('User', { id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      const currentBalance = user.balance || 0;
      const currentExposure = user.exposure || 0;
      const creditLimit = user.creditLimit || 0;

      const totalExposure = currentExposure + additionalExposure;
      const hasSufficientBalance = currentBalance >= stake;
      const hasSufficientCredit = totalExposure <= creditLimit;

      return {
        hasSufficientBalance,
        hasSufficientCredit,
        currentBalance,
        currentExposure,
        totalExposure,
        creditLimit,
        requiredStake: stake,
        additionalExposure
      };
    } catch (error) {
      logger.error('Error checking balance sufficiency:', error);
      throw error;
    }
  }

  /**
   * Get exposure summary for risk management
   * @param {string} userId - User ID
   * @returns {Object} Exposure summary
   */
  static async getExposureSummary(userId) {
    try {
      const user = await database.findOne('User', { id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      const totalExposure = await this.calculateTotalUserExposure(userId);
      const currentBalance = user.balance || 0;
      const creditLimit = user.creditLimit || 0;

      const exposureUtilization = creditLimit > 0 ? (totalExposure.totalExposure / creditLimit) * 100 : 0;
      const availableCredit = Math.max(0, creditLimit - totalExposure.totalExposure);

      return {
        userId,
        currentBalance,
        creditLimit,
        totalExposure: totalExposure.totalExposure,
        exposureUtilization: Math.round(exposureUtilization * 100) / 100,
        availableCredit,
        betCount: totalExposure.betCount,
        marketBreakdown: totalExposure.marketExposure,
        typeBreakdown: totalExposure.betTypeBreakdown
      };
    } catch (error) {
      logger.error('Error getting exposure summary:', error);
      throw error;
    }
  }
}

module.exports = ExposureService;
