const database = require('../utils/database');
const logger = require('../utils/logger');

/**
 * Bet Validation Service for comprehensive bet validation
 */
class BetValidationService {
  
  /**
   * Validate market status and block bets if market is suspended/closed
   */
  static async validateMarketStatus(matchId, marketId) {
    try {
      // Get match status
      const match = await database.findOne('Match', { id: matchId });
      if (!match) {
        return { valid: false, error: 'Match not found' };
      }

      // Check if match is suspended or closed
      if (match.status === 'SUSPENDED' || match.status === 'CLOSED') {
        return { 
          valid: false, 
          error: `Market is ${match.status.toLowerCase()}`,
          details: `Match status: ${match.status}`
        };
      }

      // Get market data from odds table
      const marketOdds = await database.findOne('MatchOdds', { 
        matchId: matchId,
        marketId: marketId 
      });

      if (marketOdds) {
        const oddsData = marketOdds.oddsData;
        if (oddsData && oddsData.status === 'SUSPENDED') {
          return { 
            valid: false, 
            error: 'Market is suspended',
            details: 'Market odds are currently suspended'
          };
        }
      }

      return { valid: true };
    } catch (error) {
      logger.error('Error validating market status:', error);
      return { valid: false, error: 'Failed to validate market status' };
    }
  }

  /**
   * Validate odds are within allowed limits and match latest odds
   */
  static async validateOdds(matchId, marketId, selectionId, odds, betType) {
    try {
      // Get latest odds data
      const marketOdds = await database.findOne('MatchOdds', { 
        matchId: matchId,
        marketId: marketId 
      });

      if (!marketOdds) {
        return { valid: false, error: 'Market odds not found' };
      }

      const oddsData = marketOdds.oddsData;
      if (!oddsData || !oddsData.section) {
        return { valid: false, error: 'Invalid market structure' };
      }

      // Find the selection
      const selection = oddsData.section.find(sec => 
        sec.nat && sec.odds && sec.odds.some(odd => 
          odd.otype === betType && odd.odds === odds
        )
      );

      if (!selection) {
        return { 
          valid: false, 
          error: 'Invalid odds for selection',
          details: `Odds ${odds} not found for ${betType} bet`
        };
      }

      // Validate odds are positive and reasonable
      if (odds <= 0) {
        return { valid: false, error: 'Invalid odds: must be greater than 0' };
      }

      if (odds > 1000) {
        return { valid: false, error: 'Invalid odds: too high' };
      }

      // Check if odds are still current (within 5 seconds tolerance)
      const oddsAge = Date.now() - new Date(marketOdds.lastUpdated).getTime();
      if (oddsAge > 5000) {
        return { 
          valid: false, 
          error: 'Odds are stale',
          details: `Odds were last updated ${Math.round(oddsAge/1000)} seconds ago`
        };
      }

      return { valid: true, selection };
    } catch (error) {
      logger.error('Error validating odds:', error);
      return { valid: false, error: 'Failed to validate odds' };
    }
  }

  /**
   * Validate user authentication and account status
   */
  static async validateUserStatus(userId) {
    try {
      const user = await database.findOne('User', { id: userId });
      if (!user) {
        return { valid: false, error: 'User not found' };
      }

      if (!user.isActive) {
        return { valid: false, error: 'User account is inactive' };
      }

      if (user.creditLimit <= 0) {
        return { valid: false, error: 'User has no credit limit' };
      }

      return { valid: true, user };
    } catch (error) {
      logger.error('Error validating user status:', error);
      return { valid: false, error: 'Failed to validate user status' };
    }
  }

  /**
   * Validate user balance and exposure for bet
   */
  static async validateUserBalance(userId, stake, betType, odds) {
    try {
      const user = await database.findOne('User', { id: userId });
      if (!user) {
        return { valid: false, error: 'User not found' };
      }

      const currentBalance = user.balance || 0;
      const currentExposure = user.exposure || 0;
      const creditLimit = user.creditLimit || 0;

      // Calculate exposure for this bet
      let betExposure = 0;
      if (betType === 'back') {
        betExposure = stake;
      } else if (betType === 'lay') {
        betExposure = stake * (odds - 1);
      }

      // Check if user has enough balance for stake
      if (stake > currentBalance) {
        return { 
          valid: false, 
          error: 'Insufficient balance',
          details: `Required: ${stake}, Available: ${currentBalance}`
        };
      }

      // Check if total exposure would exceed credit limit
      const totalExposure = currentExposure + betExposure;
      if (totalExposure > creditLimit) {
        return { 
          valid: false, 
          error: 'Exposure limit exceeded',
          details: `Total exposure: ${totalExposure}, Limit: ${creditLimit}`
        };
      }

      return { 
        valid: true, 
        currentBalance,
        currentExposure,
        betExposure,
        totalExposure
      };
    } catch (error) {
      logger.error('Error validating user balance:', error);
      return { valid: false, error: 'Failed to validate user balance' };
    }
  }

  /**
   * Validate stake against market and user limits
   */
  static async validateStakeLimits(matchId, marketId, stake, userId) {
    try {
      // Get market limits from odds data
      const marketOdds = await database.findOne('MatchOdds', { 
        matchId: matchId,
        marketId: marketId 
      });

      if (!marketOdds) {
        return { valid: false, error: 'Market not found' };
      }

      const oddsData = marketOdds.oddsData;
      if (!oddsData) {
        return { valid: false, error: 'Invalid market data' };
      }

      // Get min/max stakes from market
      const minStake = oddsData.min || 100;
      const maxStake = oddsData.max || 500000;

      if (stake < minStake) {
        return { 
          valid: false, 
          error: 'Stake below minimum',
          details: `Minimum stake: ${minStake}`
        };
      }

      if (stake > maxStake) {
        return { 
          valid: false, 
          error: 'Stake above maximum',
          details: `Maximum stake: ${maxStake}`
        };
      }

      // Get user-specific limits if they exist
      const user = await database.findOne('User', { id: userId });
      if (user) {
        const userMaxStake = user.maxStake || maxStake;
        if (stake > userMaxStake) {
          return { 
            valid: false, 
            error: 'Stake above user limit',
            details: `User maximum stake: ${userMaxStake}`
          };
        }
      }

      return { valid: true, minStake, maxStake };
    } catch (error) {
      logger.error('Error validating stake limits:', error);
      return { valid: false, error: 'Failed to validate stake limits' };
    }
  }

  /**
   * Check for duplicate bets (anti-spam protection)
   */
  static async checkDuplicateBet(userId, marketId, selectionId, odds, stake, betType) {
    try {
      const tenSecondsAgo = new Date(Date.now() - 10000);
      
      const existingBet = await database.findOne('Bet', {
        userId: userId,
        marketId: marketId,
        selectionId: selectionId,
        odds: odds,
        stake: stake,
        type: betType,
        createdAt: { $gte: tenSecondsAgo }
      });

      if (existingBet) {
        return { 
          valid: false, 
          error: 'Duplicate bet detected',
          details: 'Similar bet placed within last 10 seconds'
        };
      }

      return { valid: true };
    } catch (error) {
      logger.error('Error checking duplicate bet:', error);
      return { valid: false, error: 'Failed to check for duplicate bet' };
    }
  }

  /**
   * Validate in-play market delay if applicable
   */
  static async validateInPlayDelay(matchId, marketId) {
    try {
      const match = await database.findOne('Match', { id: matchId });
      if (!match) {
        return { valid: false, error: 'Match not found' };
      }

      // If match is live, enforce in-play delay
      if (match.isLive) {
        // Get market data to check if it's an in-play market
        const marketOdds = await database.findOne('MatchOdds', { 
          matchId: matchId,
          marketId: marketId 
        });

        if (marketOdds && marketOdds.oddsData && marketOdds.oddsData.inPlay) {
          // Enforce 5-second delay for in-play markets
          const lastUpdate = new Date(marketOdds.lastUpdated);
          const timeSinceUpdate = Date.now() - lastUpdate.getTime();
          
          if (timeSinceUpdate < 5000) {
            return { 
              valid: false, 
              error: 'In-play delay enforced',
              details: `Please wait ${Math.ceil((5000 - timeSinceUpdate)/1000)} seconds`
            };
          }
        }
      }

      return { valid: true };
    } catch (error) {
      logger.error('Error validating in-play delay:', error);
      return { valid: false, error: 'Failed to validate in-play delay' };
    }
  }

  /**
   * Comprehensive bet validation combining all checks
   */
  static async validateBet(betData) {
    const {
      userId,
      matchId,
      marketId,
      selectionId,
      odds,
      stake,
      type: betType
    } = betData;

    try {
      // 1. Validate market status
      const marketStatusValidation = await this.validateMarketStatus(matchId, marketId);
      if (!marketStatusValidation.valid) {
        return marketStatusValidation;
      }

      // 2. Validate odds
      const oddsValidation = await this.validateOdds(matchId, marketId, selectionId, odds, betType);
      if (!oddsValidation.valid) {
        return oddsValidation;
      }

      // 3. Validate user status
      const userValidation = await this.validateUserStatus(userId);
      if (!userValidation.valid) {
        return userValidation;
      }

      // 4. Validate user balance and exposure
      const balanceValidation = await this.validateUserBalance(userId, stake, betType, odds);
      if (!balanceValidation.valid) {
        return balanceValidation;
      }

      // 5. Validate stake limits
      const stakeValidation = await this.validateStakeLimits(matchId, marketId, stake, userId);
      if (!stakeValidation.valid) {
        return stakeValidation;
      }

      // 6. Check for duplicate bets
      const duplicateValidation = await this.checkDuplicateBet(userId, marketId, selectionId, odds, stake, betType);
      if (!duplicateValidation.valid) {
        return duplicateValidation;
      }

      // 7. Validate in-play delay
      const inPlayValidation = await this.validateInPlayDelay(matchId, marketId);
      if (!inPlayValidation.valid) {
        return inPlayValidation;
      }

      // All validations passed
      return { 
        valid: true,
        user: userValidation.user,
        selection: oddsValidation.selection,
        balanceInfo: balanceValidation,
        stakeInfo: stakeValidation
      };

    } catch (error) {
      logger.error('Error in comprehensive bet validation:', error);
      return { valid: false, error: 'Validation failed', details: error.message };
    }
  }
}

module.exports = BetValidationService;
