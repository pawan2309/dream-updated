const express = require('express');
const router = express.Router();
const jwtAuth = require('../../shared/middleware/jwtAuth');
const database = require('../utils/database');

// POST /api/bets/place - Place a new bet
router.post('/place', jwtAuth(), async (req, res) => {
  try {
    const { marketId, selectionId, selectionName, odds, stake, type, marketName, matchId } = req.body;
    const userId = req.user?.userId;

    console.log('🔍 [BETS] Bet placement request:', {
      userId,
      marketId,
      selectionId,
      selectionName,
      odds,
      stake,
      type,
      marketName,
      matchId
    });

    // Debug JWT token info
    console.log('🔍 [BETS] JWT Debug Info:', {
      hasUser: !!req.user,
      userKeys: req.user ? Object.keys(req.user) : [],
      userData: req.user
    });

    // Validate required fields
    if (!marketId || !selectionId || !odds || !stake || !type || !matchId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate stake amount
    if (stake <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stake amount',
        details: 'Stake must be greater than 0'
      });
    }

    // Validate stake is a valid number
    if (isNaN(stake) || !isFinite(stake)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stake amount',
        details: 'Stake must be a valid number'
      });
    }

    // Get user data to check chips (creditLimit)
    const user = await database.findOne('User', { id: userId });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has enough credit limit for betting
    const availableCredit = user.creditLimit || 0;
    const currentBalance = user.balance || 0;

    // Validate user has a valid credit limit
    if (!availableCredit || availableCredit <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No credit limit available',
        details: 'Your account has no credit limit set. Please contact support.',
        userCreditLimit: availableCredit
      });
    }
    
    console.log('🔍 [BETS] User data:', {
      userId: user.id,
      balance: user.balance,
      creditLimit: user.creditLimit,
      exposure: user.exposure
    });
    
    console.log('🔍 [BETS] Credit-based validation:', {
      stake: stake,
      availableCredit: availableCredit,
      currentBalance: currentBalance,
      canPlaceBet: stake <= availableCredit,
      validation: {
        creditCheck: stake <= availableCredit,
        balanceNote: 'Balance not used for validation in credit system'
      }
    });
    
    // Enhanced credit limit validation
    if (stake > availableCredit) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient credit limit',
        details: `Your stake (${stake}) exceeds your available credit limit (${availableCredit})`,
        available: availableCredit,
        required: stake,
        shortfall: stake - availableCredit,
        suggestion: `Reduce your stake to ${availableCredit} or less to place this bet`
      });
    }

    // Additional safety check: ensure stake doesn't exceed 100% of credit limit
    if (stake > availableCredit * 0.95) { // Allow up to 95% of credit limit
      console.log('⚠️ [BETS] High stake warning:', {
        stake: stake,
        availableCredit: availableCredit,
        percentage: ((stake / availableCredit) * 100).toFixed(2) + '%'
      });
    }

    // Extreme safety check: prevent unreasonably high stakes
    const maxAllowedStake = availableCredit * 10; // Maximum 10x credit limit
    if (stake > maxAllowedStake) {
      return res.status(400).json({
        success: false,
        error: 'Stake amount too high',
        details: `Stake (${stake}) exceeds maximum allowed amount (${maxAllowedStake})`,
        available: availableCredit,
        required: stake,
        maxAllowed: maxAllowedStake,
        suggestion: 'Please reduce your stake to a reasonable amount'
      });
    }
    
    // For credit-based betting, we don't need to check minimum balance
    // Users can bet up to their credit limit regardless of current balance
    console.log('✅ [BETS] Credit validation passed:', {
      stake: stake,
      availableCredit: availableCredit,
      canPlaceBet: true,
      note: 'User can place bet up to credit limit. Balance will be updated after bet placement.'
    });

    // Find match by external ID or database ID
    let match = await database.findOne('Match', { id: matchId });
    
    if (!match) {
      // Try to find by externalId
      match = await database.findOne('Match', { externalId: matchId });
    }
    
    if (!match) {
      // Try to find by beventId
      match = await database.findOne('Match', { beventId: matchId });
    }
    
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    console.log('🔍 [BETS] Match found:', {
      matchId: match.id,
      externalId: match.externalId,
      beventId: match.beventId,
      title: match.title
    });

    // Calculate potential win based on bet type
    let potentialWin = 0;
    if (type === 'back') {
      potentialWin = (odds - 1) * stake;
    } else {
      potentialWin = stake * (odds - 1);
    }

    // Validate potential win doesn't exceed reasonable limits
    const maxPotentialWin = availableCredit * 5; // Maximum 5x credit limit as potential win
    if (potentialWin > maxPotentialWin) {
      return res.status(400).json({
        success: false,
        error: 'Potential win too high',
        details: `Potential win (${potentialWin}) exceeds maximum allowed (${maxPotentialWin})`,
        stake: stake,
        odds: odds,
        type: type,
        maxAllowedWin: maxPotentialWin,
        suggestion: 'Please reduce your stake or choose different odds'
      });
    }

    // Create bet record matching the database schema
    const betData = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      matchId: match.id, // Use the actual database match ID
      marketId: marketId,
      selectionId: selectionId,
      selectionName: selectionName,
      marketName: marketName,
      odds: odds,
      stake: stake,
      type: type,
      potentialWin: potentialWin,
      status: 'PENDING', // Using the enum value from schema
      createdAt: new Date()
    };

    console.log('🔍 [BETS] Creating bet:', betData);

    // Execute all database operations in a transaction
    const result = await database.transaction(async (client) => {
      // Store bet in database
      const bet = await database.insert('Bet', betData);
      if (!bet) {
        throw new Error('Failed to create bet record');
      }

          // Update user balance (deduct stake) and exposure
    const newBalance = currentBalance - stake;
    const newExposure = (user.exposure || 0) + stake;
    
    await database.update('User', { id: userId }, {
      balance: newBalance,
      exposure: newExposure,
      updatedAt: new Date()
    });

      // Create ledger entry for the bet transaction
      const ledgerData = {
        id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        collection: 'BET_PLACEMENT',
        debit: stake,
        credit: 0,
        balanceAfter: newBalance,
        type: 'BET_PLACEMENT',
        remark: `Bet placed on ${match.title} - ${selectionName} @ ${odds}`,
        referenceId: bet.id,
        transactionType: 'BET_PLACEMENT',
        matchId: match.id,
        createdAt: new Date()
      };

      await database.insert('Ledger', ledgerData);

      return { bet, newBalance, newExposure };
    });

    const { bet, newBalance, newExposure } = result;
    console.log('✅ [BETS] Database transaction completed successfully');

    console.log('✅ [BETS] Bet placed successfully:', {
      betId: bet.id,
      newBalance,
      newExposure
    });

    // Verify the balance was actually updated
    const updatedUser = await database.findOne('User', { id: userId });
    console.log('🔍 [BETS] Balance verification:', {
      userId: updatedUser.id,
      previousBalance: currentBalance,
      newBalance: updatedUser.balance,
      stake: stake,
      expectedBalance: currentBalance - stake
    });

    // Return success response
    res.json({
      success: true,
      message: 'Bet placed successfully',
      data: {
        betId: bet.id,
        newBalance: updatedUser.balance,
        newExposure: updatedUser.exposure,
        bet: bet, // Return the actual stored bet from database
        balanceVerification: {
          previousBalance: currentBalance,
          currentBalance: updatedUser.balance,
          stake: stake,
          expectedBalance: currentBalance - stake
        }
      }
    });

  } catch (error) {
    console.error('❌ [BETS] Error placing bet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place bet',
      details: error.message
    });
  }
});

// POST /api/bets/:betId/cancel - Cancel a bet and refund stake
router.post('/:betId/cancel', jwtAuth(), async (req, res) => {
  try {
    const { betId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get the bet
    const bet = await database.findOne('Bet', { id: betId, userId: userId });
    if (!bet) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found or not owned by user'
      });
    }

    // Check if bet can be cancelled
    if (bet.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Bet cannot be cancelled - not in PENDING status',
        currentStatus: bet.status
      });
    }

    // Get current user balance
    const user = await database.findOne('User', { id: userId });
    const currentBalance = user.balance || 0;
    const currentExposure = user.exposure || 0;

    // Execute cancellation in transaction
    const result = await database.transaction(async (client) => {
      // Update bet status to CANCELLED
      await database.update('Bet', { id: betId }, {
        status: 'CANCELLED',
        updatedAt: new Date()
      });

      // Refund stake to user balance
      const newBalance = currentBalance + bet.stake;
      const newExposure = Math.max(0, currentExposure - bet.stake);

      await database.update('User', { id: userId }, {
        balance: newBalance,
        exposure: newExposure,
        updatedAt: new Date()
      });

      // Create ledger entry for refund
      const ledgerData = {
        id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        collection: 'BET_CANCELLATION',
        debit: 0,
        credit: bet.stake,
        balanceAfter: newBalance,
        type: 'BET_CANCELLATION',
        remark: `Bet cancelled - ${bet.selectionName} @ ${bet.odds} - Refund of ${bet.stake}`,
        referenceId: bet.id,
        transactionType: 'BET_CANCELLATION',
        matchId: bet.matchId,
        createdAt: new Date()
      };

      await database.insert('Ledger', ledgerData);

      return { newBalance, newExposure };
    });

    console.log('✅ [BETS] Bet cancelled successfully:', {
      betId: betId,
      refundedAmount: bet.stake,
      newBalance: result.newBalance,
      newExposure: result.newExposure
    });

    res.json({
      success: true,
      message: 'Bet cancelled successfully',
      data: {
        betId: betId,
        refundedAmount: bet.stake,
        newBalance: result.newBalance,
        newExposure: result.newExposure
      }
    });

  } catch (error) {
    console.error('❌ [BETS] Error cancelling bet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel bet',
      details: error.message
    });
  }
});

// GET /api/bets/user/:userId - Get user's bets
router.get('/user/:userId', jwtAuth(), async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;

    // Users can only view their own bets
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const bets = await database.findMany('Bet', { userId: userId });
    
    res.json({
      success: true,
      data: bets || []
    });

  } catch (error) {
    console.error('❌ [BETS] Error fetching user bets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bets'
    });
  }
});

// GET /api/bets/match/:matchId - Get bets for a specific match
router.get('/match/:matchId', jwtAuth(), async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user?.userId;

    const bets = await database.findMany('Bet', { 
      matchId: matchId,
      userId: userId 
    });
    
    res.json({
      success: true,
      data: bets || []
    });

  } catch (error) {
    console.error('❌ [BETS] Error fetching match bets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch match bets'
    });
  }
});

module.exports = router;
