const express = require('express');
const router = express.Router();
const jwtAuth = require('../../shared/middleware/jwtAuth');
const database = require('../utils/database');
const ExposureService = require('../services/exposureService');
const CommissionService = require('../services/commissionService');

// POST /api/bet-settlement/settle-match - Settle a completed match
router.post('/settle-match', jwtAuth(), async (req, res) => {
  try {
    const { matchId, winner, result, resultData } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!matchId || !winner || !result) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: matchId, winner, result'
      });
    }

    console.log('🔍 [SETTLEMENT] Processing match settlement:', {
      matchId,
      winner,
      result,
      userId
    });

    // Get the match
    const match = await database.findOne('Match', { id: matchId });
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Check if match is already settled
    if (match.status === 'SETTLED') {
      return res.status(400).json({
        success: false,
        error: 'Match is already settled',
        currentStatus: match.status
      });
    }

    // Get all pending bets for this match
    const pendingBets = await database.findMany('Bet', { 
      matchId: matchId,
      status: 'PENDING'
    });

    console.log('🔍 [SETTLEMENT] Found', pendingBets.length, 'pending bets');

    // Process all bets in a transaction
    const settlementResult = await database.transaction(async (client) => {
      let totalStakes = 0;
      let totalWinnings = 0;
      let totalLosses = 0;
      let winningBets = 0;
      let losingBets = 0;

      // Process each bet
      for (const bet of pendingBets) {
        totalStakes += bet.stake;

        // Determine if bet won or lost based on bet type
        let betWon = false;
        let wonAmount = 0;
        let lostAmount = 0;
        
        if (bet.type === 'back') {
          // Back bet: wins if selection matches winner
          betWon = bet.selectionName && bet.selectionName.includes(winner);
          if (betWon) {
            wonAmount = bet.potentialWin;
            lostAmount = 0;
          } else {
            wonAmount = 0;
            lostAmount = bet.stake;
          }
        } else if (bet.type === 'lay') {
          // Lay bet: wins if selection does NOT match winner
          betWon = !(bet.selectionName && bet.selectionName.includes(winner));
          if (betWon) {
            wonAmount = bet.stake; // Lay bet wins the stake amount
            lostAmount = 0;
          } else {
            wonAmount = 0;
            lostAmount = bet.potentialWin; // Lay bet loses potential win amount
          }
        }
        
        if (betWon) {
          // Bet won - update bet status
          bet.wonAmount = wonAmount;
          bet.lostAmount = 0;
          bet.result = winner;
          bet.status = 'WON';
          bet.settledAt = new Date();
          
          totalWinnings += wonAmount;
          winningBets++;

          // Calculate commission on winnings
          const commissionResult = await CommissionService.calculateCommission(
            bet.userId, 
            wonAmount, 
            'match'
          );

          // Update user balance (add net winnings after commission)
          const user = await database.findOne('User', { id: bet.userId });
          const newBalance = (user.balance || 0) + commissionResult.netWinnings;
          const newExposure = Math.max(0, (user.exposure || 0) - bet.stake);

          await database.update('User', { id: bet.userId }, {
            balance: newBalance,
            exposure: newExposure,
            updatedAt: new Date()
          });

          // Apply commission
          if (commissionResult.commissionAmount > 0) {
            await CommissionService.applyCommission(
              bet.userId, 
              commissionResult.commissionAmount, 
              client
            );
          }

          // Create ledger entry for winnings
          const winLedgerData = {
            id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: bet.userId,
            collection: 'BET_WIN',
            debit: 0,
            credit: commissionResult.netWinnings,
            balanceAfter: newBalance,
            type: 'BET_WIN',
            remark: `Bet won on ${match.title} - ${bet.selectionName} @ ${bet.odds} (${bet.type}) - Won ${wonAmount}, Commission: ${commissionResult.commissionAmount}`,
            referenceId: bet.id,
            transactionType: 'BET_WIN',
            matchId: match.id,
            createdAt: new Date()
          };

          await database.insert('Ledger', winLedgerData);

          // Distribute profit/loss up the hierarchy
          try {
            await CommissionService.distributeProfitLoss(
              bet.userId, 
              commissionResult.netWinnings, 
              match.id, 
              client
            );
          } catch (error) {
            console.error('Error distributing profit:', error);
            // Continue with settlement even if distribution fails
          }

        } else {
          // Bet lost - update bet status
          bet.wonAmount = 0;
          bet.lostAmount = lostAmount;
          bet.result = winner;
          bet.status = 'LOST';
          bet.settledAt = new Date();
          
          totalLosses += lostAmount;
          losingBets++;

          // Create ledger entry for loss
          const lossLedgerData = {
            id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: bet.userId,
            collection: 'BET_LOSS',
            debit: lostAmount,
            credit: 0,
            balanceAfter: (await database.findOne('User', { id: bet.userId })).balance,
            type: 'BET_LOSS',
            remark: `Bet lost on ${match.title} - ${bet.selectionName} @ ${bet.odds} (${bet.type}) - Lost ${lostAmount}`,
            referenceId: bet.id,
            transactionType: 'BET_LOSS',
            matchId: match.id,
            createdAt: new Date()
          };

          await database.insert('Ledger', lossLedgerData);

          // Distribute loss up the hierarchy
          try {
            await CommissionService.distributeProfitLoss(
              bet.userId, 
              -lostAmount, // Negative amount for loss
              match.id, 
              client
            );
          } catch (error) {
            console.error('Error distributing loss:', error);
            // Continue with settlement even if distribution fails
          }
        }

        // Update bet in database
        await database.update('Bet', { id: bet.id }, {
          wonAmount: bet.wonAmount,
          lostAmount: bet.lostAmount,
          result: bet.result,
          status: bet.status,
          settledAt: bet.settledAt,
          updatedAt: new Date()
        });
      }

      // Update match status
      await database.update('Match', { id: matchId }, {
        status: 'SETTLED',
        winner: winner,
        result: result,
        settledAt: new Date(),
        resultData: resultData || {},
        lastUpdated: new Date()
      });

      // Create settlement record
      const settlementData = {
        id: `settlement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        matchId: matchId,
        winner: winner,
        result: result,
        settledAt: new Date(),
        totalStakes: totalStakes,
        totalWinnings: totalWinnings,
        totalLosses: totalLosses,
        winningBets: winningBets,
        losingBets: losingBets,
        isProcessed: true,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await database.insert('BetSettlement', settlementData);

      return {
        totalStakes,
        totalWinnings,
        totalLosses,
        winningBets,
        losingBets
      };
    });

    console.log('✅ [SETTLEMENT] Match settled successfully:', settlementResult);

    res.json({
      success: true,
      message: 'Match settled successfully',
      data: {
        matchId: matchId,
        winner: winner,
        result: result,
        settlement: settlementResult
      }
    });

  } catch (error) {
    console.error('❌ [SETTLEMENT] Error settling match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to settle match',
      details: error.message
    });
  }
});

// GET /api/bet-settlement/match/:matchId - Get settlement details for a match
router.get('/match/:matchId', jwtAuth(), async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get match details
    const match = await database.findOne('Match', { id: matchId });
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Get all bets for this match
    const bets = await database.findMany('Bet', { matchId: matchId });
    
    // Get settlement record if exists
    const settlement = await database.findOne('BetSettlement', { matchId: matchId });

    // Calculate summary
    const summary = {
      totalBets: bets.length,
      pendingBets: bets.filter(b => b.status === 'PENDING').length,
      wonBets: bets.filter(b => b.status === 'WON').length,
      lostBets: bets.filter(b => b.status === 'LOST').length,
      totalStakes: bets.reduce((sum, b) => sum + b.stake, 0),
      totalWinnings: bets.reduce((sum, b) => sum + (b.wonAmount || 0), 0),
      totalLosses: bets.reduce((sum, b) => sum + (b.lostAmount || 0), 0)
    };

    res.json({
      success: true,
      data: {
        match: match,
        bets: bets,
        settlement: settlement,
        summary: summary
      }
    });

  } catch (error) {
    console.error('❌ [SETTLEMENT] Error fetching settlement details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settlement details',
      details: error.message
    });
  }
});

// GET /api/bet-settlement/user/:userId - Get user's settlement history
router.get('/user/:userId', jwtAuth(), async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;

    // Users can only view their own settlements
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get user's settled bets
    const settledBets = await database.findMany('Bet', { 
      userId: userId,
      status: { in: ['WON', 'LOST'] }
    });

    // Get user's settlement records
    const settlements = await database.findMany('BetSettlement', { 
      userId: userId 
    });

    // Calculate user summary
    const summary = {
      totalBets: settledBets.length,
      wonBets: settledBets.filter(b => b.status === 'WON').length,
      lostBets: settledBets.filter(b => b.status === 'LOST').length,
      totalStakes: settledBets.reduce((sum, b) => sum + b.stake, 0),
      totalWinnings: settledBets.reduce((sum, b) => sum + (b.wonAmount || 0), 0),
      totalLosses: settledBets.reduce((sum, b) => sum + (b.lostAmount || 0), 0),
      netProfit: settledBets.reduce((sum, b) => sum + (b.wonAmount || 0) - (b.lostAmount || 0), 0)
    };

    res.json({
      success: true,
      data: {
        bets: settledBets,
        settlements: settlements,
        summary: summary
      }
    });

  } catch (error) {
    console.error('❌ [SETTLEMENT] Error fetching user settlements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user settlements',
      details: error.message
    });
  }
});

module.exports = router;
