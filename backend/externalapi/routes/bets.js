const express = require('express');
const router = express.Router();
const jwtAuth = require('../../shared/middleware/jwtAuth');
const database = require('../utils/database');
const BetValidationService = require('../services/betValidationService');
const ExposureService = require('../services/exposureService');
const CommissionService = require('../services/commissionService');

// POST /api/bets/place - Place a new bet
router.post('/place', jwtAuth(), async (req, res) => {
  try {
    const { 
      marketId, 
      selectionId, 
      selectionName, 
      odds, 
      stake, 
      type, 
      marketName, 
      matchId,
      // Enhanced odds data fields
      marketType,
      oddsSnapshot,
      oddsTier,
      availableStake
    } = req.body;
    
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
      matchId,
      marketType,
      oddsTier,
      availableStake
    });

    // Debug JWT token info
    console.log('🔍 [BETS] JWT Debug Info:', {
      hasUser: !!req.user,
      userKeys: req.user ? Object.keys(req.user) : [],
      userData: req.user
    });

    // Enhanced bet validation using BetValidationService
    const validationResult = await BetValidationService.validateBet({
      userId,
      matchId,
      marketId,
      selectionId,
      odds,
      stake,
      type
    });

    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: validationResult.error,
        details: validationResult.details || null
      });
    }

    const { user, selection, balanceInfo, stakeInfo } = validationResult;

    // Calculate potential outcomes using ExposureService
    const potentialOutcomes = ExposureService.calculatePotentialOutcomes(type, stake, odds);
    const potentialWin = potentialOutcomes.potentialWin;

    // Create bet record matching the database schema
    const betData = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      matchId: matchId,
      marketId: marketId,
      selectionId: selectionId,
      selectionName: selectionName,
      marketName: marketName,
      odds: odds,
      stake: stake,
      type: type,
      potentialWin: potentialWin,
      status: 'PENDING',
      // Enhanced odds data
      marketType: marketType || null,
      oddsSnapshot: oddsSnapshot || null,
      oddsTier: oddsTier || null,
      availableStake: availableStake || null,
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

      // Calculate bet exposure using ExposureService
      const betExposure = ExposureService.calculateBetExposure(type, stake, odds);
      
      // Update user balance and exposure using ExposureService
      const balanceUpdateResult = await ExposureService.updateUserBalanceAndExposure(
        userId, 
        stake, 
        betExposure, 
        client
      );

      // Create ledger entry for the bet transaction
      const ledgerData = {
        id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        collection: 'BET_PLACEMENT',
        debit: stake,
        credit: 0,
        balanceAfter: balanceUpdateResult.newBalance,
        type: 'BET_PLACEMENT',
        remark: `Bet placed on ${selectionName} @ ${odds} (${type})`,
        referenceId: bet.id,
        transactionType: 'BET_PLACEMENT',
        matchId: matchId,
        createdAt: new Date()
      };

      await database.insert('Ledger', ledgerData);

      return { 
        bet, 
        newBalance: balanceUpdateResult.newBalance, 
        newExposure: balanceUpdateResult.newExposure,
        betExposure
      };
    });

    const { bet, newBalance, newExposure, betExposure } = result;
    console.log('✅ [BETS] Database transaction completed successfully');

    console.log('✅ [BETS] Bet placed successfully:', {
      betId: bet.id,
      newBalance,
      newExposure,
      betExposure
    });

    // Return success response
    res.json({
      success: true,
      message: 'Bet placed successfully',
      data: {
        betId: bet.id,
        newBalance: newBalance,
        newExposure: newExposure,
        betExposure: betExposure,
        bet: bet,
        validationInfo: {
          marketStatus: 'VALID',
          oddsValidation: 'VALID',
          userStatus: 'ACTIVE',
          balanceSufficient: true,
          exposureWithinLimit: true
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

      // Calculate bet exposure for proper reversal
      const betExposure = ExposureService.calculateBetExposure(bet.type, bet.stake, bet.odds);
      
      // Revert user balance and exposure using ExposureService
      const balanceUpdateResult = await ExposureService.revertUserBalanceAndExposure(
        userId,
        bet.stake,
        betExposure,
        client
      );

      // Create ledger entry for refund
      const ledgerData = {
        id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        collection: 'BET_CANCELLATION',
        debit: 0,
        credit: bet.stake,
        balanceAfter: balanceUpdateResult.newBalance,
        type: 'BET_CANCELLATION',
        remark: `Bet cancelled - ${bet.selectionName} @ ${bet.odds} (${bet.type}) - Refund of ${bet.stake}`,
        referenceId: bet.id,
        transactionType: 'BET_CANCELLATION',
        matchId: bet.matchId,
        createdAt: new Date()
      };

      await database.insert('Ledger', ledgerData);

      return { 
        newBalance: balanceUpdateResult.newBalance, 
        newExposure: balanceUpdateResult.newExposure,
        refundedStake: bet.stake,
        removedExposure: betExposure
      };
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

// GET /api/bets/exposure/:userId - Get user exposure summary
router.get('/exposure/:userId', jwtAuth(), async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;

    // Users can only view their own exposure
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const exposureSummary = await ExposureService.getExposureSummary(userId);
    
    res.json({
      success: true,
      data: exposureSummary
    });

  } catch (error) {
    console.error('❌ [BETS] Error fetching user exposure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exposure summary'
    });
  }
});

// GET /api/bets/commission/:userId - Get user commission summary
router.get('/commission/:userId', jwtAuth(), async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;

    // Users can only view their own commission info
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const commissionSummary = await CommissionService.getCommissionSummary(userId);
    
    res.json({
      success: true,
      data: commissionSummary
    });

  } catch (error) {
    console.error('❌ [BETS] Error fetching user commission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commission summary'
    });
  }
});

module.exports = router;
