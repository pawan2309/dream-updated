const database = require('../utils/database');
const logger = require('../utils/logger');

/**
 * Market Service for managing market operations and status
 */
class MarketService {
  
  /**
   * Get market status for a specific match and market
   * @param {string} matchId - Match ID
   * @param {string} marketId - Market ID
   * @returns {Object} Market status information
   */
  static async getMarketStatus(matchId, marketId) {
    try {
      // Get match status
      const match = await database.findOne('Match', { id: matchId });
      if (!match) {
        return { error: 'Match not found' };
      }

      // Get market odds data
      const marketOdds = await database.findOne('MatchOdds', { 
        matchId: matchId,
        marketId: marketId 
      });

      if (!marketOdds) {
        return { error: 'Market not found' };
      }

      const oddsData = marketOdds.oddsData;
      const marketStatus = oddsData?.status || 'UNKNOWN';
      const isActive = marketStatus === 'OPEN' && match.status !== 'SUSPENDED' && match.status !== 'CLOSED';

      return {
        matchId,
        marketId,
        matchStatus: match.status,
        marketStatus: marketStatus,
        isActive: isActive,
        lastUpdated: marketOdds.lastUpdated,
        selections: oddsData?.section || []
      };
    } catch (error) {
      logger.error('Error getting market status:', error);
      throw error;
    }
  }

  /**
   * Suspend a market (block new bets)
   * @param {string} matchId - Match ID
   * @param {string} marketId - Market ID
   * @param {string} reason - Reason for suspension
   * @returns {Object} Suspension result
   */
  static async suspendMarket(matchId, marketId, reason = 'Market suspended') {
    try {
      const marketOdds = await database.findOne('MatchOdds', { 
        matchId: matchId,
        marketId: marketId 
      });

      if (!marketOdds) {
        return { error: 'Market not found' };
      }

      // Update market status to suspended
      const updatedOddsData = {
        ...marketOdds.oddsData,
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspensionReason: reason
      };

      await database.update('MatchOdds', { id: marketOdds.id }, {
        oddsData: updatedOddsData,
        lastUpdated: new Date()
      });

      logger.info(`Market ${marketId} suspended for match ${matchId}: ${reason}`);

      return {
        success: true,
        marketId,
        matchId,
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        reason: reason
      };
    } catch (error) {
      logger.error('Error suspending market:', error);
      throw error;
    }
  }

  /**
   * Activate a suspended market
   * @param {string} matchId - Match ID
   * @param {string} marketId - Market ID
   * @returns {Object} Activation result
   */
  static async activateMarket(matchId, marketId) {
    try {
      const marketOdds = await database.findOne('MatchOdds', { 
        matchId: matchId,
        marketId: marketId 
      });

      if (!marketOdds) {
        return { error: 'Market not found' };
      }

      // Update market status to open
      const updatedOddsData = {
        ...marketOdds.oddsData,
        status: 'OPEN',
        activatedAt: new Date()
      };

      // Remove suspension info
      delete updatedOddsData.suspendedAt;
      delete updatedOddsData.suspensionReason;

      await database.update('MatchOdds', { id: marketOdds.id }, {
        oddsData: updatedOddsData,
        lastUpdated: new Date()
      });

      logger.info(`Market ${marketId} activated for match ${matchId}`);

      return {
        success: true,
        marketId,
        matchId,
        status: 'OPEN',
        activatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error activating market:', error);
      throw error;
    }
  }

  /**
   * Close a market (no more bets allowed)
   * @param {string} matchId - Match ID
   * @param {string} marketId - Market ID
   * @returns {Object} Closure result
   */
  static async closeMarket(matchId, marketId) {
    try {
      const marketOdds = await database.findOne('MatchOdds', { 
        matchId: matchId,
        marketId: marketId 
      });

      if (!marketOdds) {
        return { error: 'Market not found' };
      }

      // Update market status to closed
      const updatedOddsData = {
        ...marketOdds.oddsData,
        status: 'CLOSED',
        closedAt: new Date()
      };

      await database.update('MatchOdds', { id: marketOdds.id }, {
        oddsData: updatedOddsData,
        lastUpdated: new Date()
      });

      logger.info(`Market ${marketId} closed for match ${matchId}`);

      return {
        success: true,
        marketId,
        matchId,
        status: 'CLOSED',
        closedAt: new Date()
      };
    } catch (error) {
      logger.error('Error closing market:', error);
      throw error;
    }
  }

  /**
   * Get all markets for a match
   * @param {string} matchId - Match ID
   * @returns {Array} Array of market information
   */
  static async getMatchMarkets(matchId) {
    try {
      const marketOdds = await database.findMany('MatchOdds', { matchId: matchId });
      
      const markets = marketOdds.map(market => ({
        marketId: market.marketId,
        eventId: market.eventId,
        status: market.oddsData?.status || 'UNKNOWN',
        lastUpdated: market.lastUpdated,
        selections: market.oddsData?.section || []
      }));

      return markets;
    } catch (error) {
      logger.error('Error getting match markets:', error);
      throw error;
    }
  }

  /**
   * Update market odds data
   * @param {string} matchId - Match ID
   * @param {string} marketId - Market ID
   * @param {Object} newOddsData - New odds data
   * @returns {Object} Update result
   */
  static async updateMarketOdds(matchId, marketId, newOddsData) {
    try {
      const marketOdds = await database.findOne('MatchOdds', { 
        matchId: matchId,
        marketId: marketId 
      });

      if (!marketOdds) {
        return { error: 'Market not found' };
      }

      // Preserve status and other metadata
      const updatedOddsData = {
        ...newOddsData,
        status: marketOdds.oddsData?.status || 'OPEN',
        lastUpdated: new Date()
      };

      await database.update('MatchOdds', { id: marketOdds.id }, {
        oddsData: updatedOddsData,
        lastUpdated: new Date()
      });

      logger.info(`Market ${marketId} odds updated for match ${matchId}`);

      return {
        success: true,
        marketId,
        matchId,
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error updating market odds:', error);
      throw error;
    }
  }

  /**
   * Check if market is accepting bets
   * @param {string} matchId - Match ID
   * @param {string} marketId - Market ID
   * @returns {Object} Bet acceptance status
   */
  static async canAcceptBets(matchId, marketId) {
    try {
      const marketStatus = await this.getMarketStatus(matchId, marketId);
      
      if (marketStatus.error) {
        return { canAccept: false, reason: marketStatus.error };
      }

      if (!marketStatus.isActive) {
        return { 
          canAccept: false, 
          reason: `Market is ${marketStatus.marketStatus.toLowerCase()}` 
        };
      }

      // Check if match is in a state that allows betting
      if (['SUSPENDED', 'CLOSED', 'SETTLED'].includes(marketStatus.matchStatus)) {
        return { 
          canAccept: false, 
          reason: `Match is ${marketStatus.matchStatus.toLowerCase()}` 
        };
      }

      return { canAccept: true };
    } catch (error) {
      logger.error('Error checking bet acceptance:', error);
      return { canAccept: false, reason: 'Error checking market status' };
    }
  }
}

module.exports = MarketService;
