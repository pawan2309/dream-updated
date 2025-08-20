const express = require('express');
const router = express.Router();
const database = require('../utils/database');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const config = require('../../config');

// Helper function to extract username from JWT token
const extractUserId = (req) => {
  // JWT token should contain username, not UUID
  // Try to get username from JWT payload
  const username = req.user?.username || req.user?.sub || req.user?.id || req.user?.userId || req.user?.user_id;
  
  if (!username) {
    throw new Error('Username not found in token');
  }
  
  // Log what we're extracting
  console.log('🔍 [JWT] Extracted username:', username, 'type:', typeof username);
  
  return username;
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      logger.error(`❌ [AUTH] JWT verification failed:`, err.message);
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    
    req.user = decoded;
    next();
  });
};

/**
 * POST /api/bet
 * Place a new bet
 */
router.post('/', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  try {
    const { matchId, marketId, selection, stake, odds, betType } = req.body;
    
    // Extract userId using helper function
    let userId;
    try {
      userId = extractUserId(req);
    } catch (error) {
      logger.error(`❌ [BET] User ID extraction failed:`, error.message);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.info(`🎯 [BET] Placing bet for user: ${userId}, match: ${matchId}, market: ${marketId}`);
    logger.info(`🔍 [BET] User ID from JWT: ${userId}, type: ${typeof userId}`);

    // Validate required fields
    if (!matchId || !marketId || !selection || !stake || !odds || !betType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: matchId, marketId, selection, stake, odds, betType'
      });
    }

    // Validate bet type
    if (!['back', 'lay'].includes(betType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bet type. Must be "back" or "lay"'
      });
    }

    // Validate stake amount
    if (stake <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Stake amount must be greater than 0'
      });
    }

    // Use database transaction to ensure data consistency
    const result = await database.transaction(async (client) => {
      // Get user with current credit limit and exposure
      // Since we're now extracting username from JWT, try username first, then code
      let user = await database.findOne('User', { username: userId }, ['id', 'username', 'creditLimit', 'exposure']);
      
      // If not found by username, try by code
      if (!user) {
        user = await database.findOne('User', { code: userId }, ['id', 'username', 'code', 'creditLimit', 'exposure']);
      }

      if (!user) {
        throw new Error(`User not found with identifier: ${userId}`);
      }

      // Calculate potential exposure for this bet
      let potentialExposure = 0;
      if (betType === 'back') {
        // For back bet: if bet wins, user gets (stake * odds) - stake
        potentialExposure = stake;
      } else if (betType === 'lay') {
        // For lay bet: if bet loses, user pays (stake * odds) - stake
        potentialExposure = (stake * odds) - stake;
      }

      // Check if user has sufficient credit limit for the stake only
      if (user.creditLimit < stake) {
        throw new Error(`Insufficient credit limit. Required: ${stake.toFixed(2)}, Available: ${user.creditLimit.toFixed(2)}`);
      }



      // Verify match exists
      const match = await database.findOne('Match', { matchId: matchId }, ['id', 'matchName', 'status']);

      if (!match) {
        throw new Error('Match not found');
      }

      // Since odds are stored in Redis, we don't need to validate against a MatchOdds table
      // The frontend already validates the odds before sending the request
      logger.info(`✅ [BET] Match found: ${match.matchName}, proceeding with bet placement`);

      // Validate that the odds and market data are reasonable
      if (!odds || odds <= 1.0) {
        throw new Error('Invalid odds value');
      }

      if (!selection || selection.trim() === '') {
        throw new Error('Selection is required');
      }

      // Create the bet using the USERNAME from JWT
      logger.info(`🔍 [BET] Creating bet with userId (username): ${userId}, type: ${typeof userId}`);
      const bet = await database.insert('Bet', {
        id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,  // This should now be "USE0001" instead of UUID
        matchId: matchId,
        marketId: marketId,
        selection: selection,
        stake: stake,
        odds: odds,
        betType: betType,
        status: 'PENDING',
        createdAt: new Date()
      });

      // Update user creditLimit and exposure using username
      const newCreditLimit = user.creditLimit - stake;
      const newExposure = user.exposure + potentialExposure;
      
      logger.info(`🔧 [BET] Updating user ${userId}: creditLimit ${user.creditLimit} → ${newCreditLimit}, exposure ${user.exposure} → ${newExposure}`);
      
      // Update using username lookup, NOT UUID
      const updateResult = await database.update('User', {
        creditLimit: newCreditLimit,
        exposure: newExposure
      }, { username: userId });
      
      logger.info(`🔧 [BET] User update result: ${JSON.stringify(updateResult)}`);

      // Create ledger entry using username
      await database.insert('Ledger', {
          id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: userId,
          matchId: matchId,
          marketId: marketId,
          betId: bet.id,
          type: 'BET_PLACEMENT',
          amount: -stake, // Deduct stake amount
          createdAt: new Date()
        });

                             logger.info(`✅ [BET] Bet placed successfully. Bet ID: ${bet.id}, User: ${user.username}, Stake: ${stake}, Exposure: ${potentialExposure}, New Total Exposure: ${newExposure}`);

             return {
         bet,
         exposureAfter: newExposure,
         creditLimitRemaining: newCreditLimit,
         user: { username: user.username }
       };
    });

    const responseTime = Date.now() - startTime;
    logger.info(`✅ [BET] Bet placement completed in ${responseTime}ms`);

    res.json({
      success: true,
      message: 'Bet placed successfully',
      data: {
        betId: result.bet.id,
        exposureAfter: result.exposureAfter,
        creditLimitRemaining: result.creditLimitRemaining,
        message: `Bet placed successfully. New exposure: ${result.exposureAfter.toFixed(2)}, Credit remaining: ${result.creditLimitRemaining.toFixed(2)}`
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(`❌ [BET] Bet placement failed in ${responseTime}ms: ${error.message}`);
    
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to place bet'
    });
  }
});

/**
 * POST /api/bet/settle
 * Settle a bet and update user exposure
 */
router.post('/settle', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  try {
    const { betId, result, winner } = req.body;
    
    // Extract userId using helper function
    let userId;
    try {
      userId = extractUserId(req);
    } catch (error) {
      logger.error(`❌ [BET] User ID extraction failed:`, error.message);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.info(`🏁 [BET] Settling bet: ${betId}, result: ${result}, winner: ${winner}`);

    // Validate required fields
    if (!betId || !result) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: betId, result'
      });
    }

    // Use database transaction to ensure data consistency
    const settlementResult = await database.transaction(async (client) => {
      // Get the bet
      const bet = await database.findOne('Bet', { id: betId }, [
        'id', 'userId', 'matchId', 'marketId', 'selection', 'stake', 'odds', 'betType', 'status', 'createdAt'
      ]);

      if (!bet) {
        throw new Error('Bet not found');
      }

      // Verify the bet belongs to the authenticated user
      if (bet.userId !== userId) {
        throw new Error('Unauthorized: Bet does not belong to user');
      }

      if (bet.status !== 'PENDING') {
        throw new Error('Bet is already settled or cancelled');
      }

             // Get user data separately using username
       const user = await database.findOne('User', { username: userId }, ['id', 'username', 'exposure']);

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate payout based on bet type and result
      let payout = 0;
      let exposureReduction = 0;

      if (bet.betType === 'back') {
        if (result === 'WON') {
          // Back bet won: user gets (stake * odds) - stake
          payout = (bet.stake * bet.odds) - bet.stake;
          exposureReduction = bet.stake; // Reduce exposure by original stake
        } else if (result === 'LOST') {
          // Back bet lost: user loses stake
          exposureReduction = bet.stake; // Reduce exposure by original stake
        }
      } else if (bet.betType === 'lay') {
        if (result === 'WON') {
          // Lay bet won: user gets stake
          exposureReduction = (bet.stake * bet.odds) - bet.stake; // Reduce exposure
        } else if (result === 'LOST') {
          // Lay bet lost: user pays (stake * odds) - stake
          exposureReduction = (bet.stake * bet.odds) - bet.stake; // Reduce exposure
        }
      }

      // Update bet status
      await database.update('Bet', { id: betId }, {
        status: result,
        settledAt: new Date()
      });

      // Update user exposure using username
      const newExposure = user.exposure - exposureReduction;

      await database.update('User', {
        exposure: newExposure
      }, { username: userId });

      // Create ledger entry for settlement
      await database.insert('Ledger', {
        id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        matchId: bet.matchId,
        marketId: bet.marketId,
        betId: betId,
        type: 'BET_SETTLEMENT',
        amount: payout,
        createdAt: new Date()
      });

      logger.info(`✅ [BET] Bet settled successfully. Bet ID: ${betId}, Result: ${result}, Payout: ${payout}, New Exposure: ${newExposure}`);

      return {
        betId,
        result,
        payout,
        newExposure
      };
    });

    res.json({
      success: true,
      message: 'Bet settled successfully',
      data: settlementResult
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(`❌ [BET] Bet settlement failed in ${responseTime}ms: ${error.message}`);
    
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to settle bet'
    });
  }
});



/**
 * GET /api/bet/user
 * Get all bets for the authenticated user
 */
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = extractUserId(req);
    logger.info(`📋 [BET] Fetching bets for user: ${userId}`);

    const bets = await database.findMany('Bet', { "userId": userId });

    logger.info(`✅ [BET] Found ${bets.length} bets for user: ${userId}`);

    res.json({
      success: true,
      bets: bets
    });

  } catch (error) {
    logger.error(`❌ [BET] Failed to fetch user bets: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bets'
    });
  }
});

/**
 * GET /api/bet/match/:matchId
 * Get all bets for a specific match
 */
router.get('/match/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = extractUserId(req);

    logger.info(`📋 [BET] Fetching bets for match: ${matchId}, user: ${userId}`);

    const bets = await database.findMany('Bet', { "matchId": matchId, "userId": userId });

    logger.info(`✅ [BET] Found ${bets.length} bets for match: ${matchId}`);

    res.json({
      success: true,
      bets: bets
    });

  } catch (error) {
    logger.error(`❌ [BET] Failed to fetch match bets: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match bets'
    });
  }
});

/**
 * GET /api/bet/market/:marketId
 * Get all bets for a specific market
 */
router.get('/market/:marketId', authenticateToken, async (req, res) => {
  try {
    const { marketId } = req.params;
    const userId = extractUserId(req);

    logger.info(`📋 [BET] Fetching bets for market: ${marketId}, user: ${userId}`);

    const bets = await database.findMany('Bet', { "marketId": marketId, "userId": userId });

    logger.info(`✅ [BET] Found ${bets.length} bets for market: ${marketId}`);

    res.json({
      success: true,
      bets: bets
    });

  } catch (error) {
    logger.error(`❌ [BET] Failed to fetch market bets: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market bets'
    });
  }
});

/**
 * GET /api/bet/debug
 * Debug endpoint to check bet table and data
 */
router.get('/debug', async (req, res) => {
  try {
    logger.info(`🔍 [DEBUG] Checking bet table status...`);
    
    // Check if bet table exists
    const tableExists = await database.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Bet'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      return res.json({
        success: false,
        message: 'Bet table does not exist yet',
        tableExists: false
      });
    }
    
    // Check table structure
    const structure = await database.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Bet' 
      ORDER BY ordinal_position
    `);
    
    // Count total bets
    const betCount = await database.query(`
      SELECT COUNT(*) as total_bets FROM public."Bet"
    `);
    
    // Get sample bets (first 5)
    const sampleBets = await database.query(`
      SELECT * FROM public."Bet" ORDER BY "createdAt" DESC LIMIT 5
    `);
    
    logger.info(`✅ [DEBUG] Bet table exists with ${betCount.rows[0].total_bets} bets`);
    
    res.json({
      success: true,
      tableExists: true,
      tableStructure: structure.rows,
      totalBets: betCount.rows[0].total_bets,
      sampleBets: sampleBets.rows,
      message: `Found ${betCount.rows[0].total_bets} bets in database`
    });
    
  } catch (error) {
    logger.error(`❌ [DEBUG] Error checking bet table:`, error.message);
    res.status(500).json({
      success: false,
      message: `Error checking bet table: ${error.message}`,
      error: error.message
    });
  }
});

/**
 * GET /api/bet/health
 * Health check endpoint (no auth required)
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bet service is running',
    timestamp: new Date().toISOString(),
    route: '/api/bet/health'
  });
});

/**
 * GET /api/bet/test
 * Test endpoint to verify the route is working
 */
router.get('/test', (req, res) => {
  logger.info(`🧪 [BET] Test endpoint called`);
  res.json({
    success: true,
    message: 'Bet route is working',
    timestamp: new Date().toISOString(),
    route: '/api/bet/test'
  });
});

module.exports = router;