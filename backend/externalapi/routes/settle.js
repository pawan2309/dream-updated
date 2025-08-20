const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const prisma = new PrismaClient();

// Middleware to verify JWT token and check admin role
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, config.jwtSecret, async (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Check if user has admin role
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
      });

      if (!dbUser || !['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(dbUser.role)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error(`❌ [SETTLE] Error checking user role: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
};

/**
 * POST /api/settle/market/:marketId
 * Settle all bets for a specific market
 */
router.post('/market/:marketId', authenticateAdmin, async (req, res) => {
  const startTime = Date.now();
  try {
    const { marketId } = req.params;
    const { result, winner } = req.body;
    const adminId = req.user.id;

    logger.info(`🎯 [SETTLE] Starting market settlement for market: ${marketId}, admin: ${adminId}`);

    if (!result || !winner) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: result, winner'
      });
    }

    // Use Prisma transaction to ensure data consistency
    const settlementResult = await prisma.$transaction(async (tx) => {
      // Get all pending bets for this market
      const pendingBets = await tx.bet.findMany({
        where: { 
          marketId: marketId,
          status: 'PENDING'
        },
        include: {
          user: {
            select: { id: true, balance: true, username: true }
          },
          match: {
            select: { matchName: true, matchId: true }
          }
        }
      });

      if (pendingBets.length === 0) {
        throw new Error('No pending bets found for this market');
      }

      logger.info(`📋 [SETTLE] Found ${pendingBets.length} pending bets for market: ${marketId}`);

      let totalWinnings = 0;
      let totalLosses = 0;
      const settledBets = [];

      // Process each bet
      for (const bet of pendingBets) {
        let betStatus = 'LOST';
        let profitLoss = 0;
        let isWinner = false;

        // Check if bet is a winner
        if (bet.selection === winner) {
          betStatus = 'WON';
          isWinner = true;
          
          if (bet.betType === 'back') {
            profitLoss = (bet.odds - 1) * bet.stake;
          } else { // lay
            profitLoss = bet.stake;
          }
        } else {
          // Bet is a loser
          if (bet.betType === 'back') {
            profitLoss = -bet.stake;
          } else { // lay
            profitLoss = -(bet.odds - 1) * bet.stake;
          }
        }

        // Update bet status
        const updatedBet = await tx.bet.update({
          where: { id: bet.id },
          data: {
            status: betStatus,
            profitLoss: profitLoss,
            settledAt: new Date()
          }
        });

        // No balance update needed
        await tx.user.update({
          where: { id: bet.user.id },
          data: { updatedAt: new Date() }
        });

        // Create ledger entry
        await tx.ledger.create({
          data: {
            userId: bet.user.id,
            matchId: bet.match.matchId,
            marketId: marketId,
            betId: bet.id,
            type: isWinner ? 'BET_WIN' : 'BET_LOSS',
            amount: profitLoss
          }
        });

        if (isWinner) {
          totalWinnings += profitLoss;
        } else {
          totalLosses += Math.abs(profitLoss);
        }

        settledBets.push({
          betId: bet.id,
          userId: bet.user.id,
          username: bet.user.username,
          selection: bet.selection,
          betType: bet.betType,
          stake: bet.stake,
          odds: bet.odds,
          status: betStatus,
          profitLoss: profitLoss
        });
      }

      // Update market status to settled
      await tx.matchOdds.updateMany({
        where: { marketId: marketId },
        data: { 
          status: 'SETTLED',
          lastUpdated: new Date()
        }
      });

      logger.info(`✅ [SETTLE] Market ${marketId} settled successfully. Winnings: ${totalWinnings}, Losses: ${totalLosses}`);

      return {
        marketId,
        totalBets: pendingBets.length,
        totalWinnings,
        totalLosses,
        settledBets,
        result,
        winner
      };
    });

    const responseTime = Date.now() - startTime;
    logger.info(`✅ [SETTLE] Market settlement completed in ${responseTime}ms`);

    res.json({
      success: true,
      message: 'Market settled successfully',
      data: settlementResult
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(`❌ [SETTLE] Market settlement failed in ${responseTime}ms: ${error.message}`);
    
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to settle market'
    });
  }
});

/**
 * POST /api/settle/match/:matchId
 * Settle all markets for a specific match
 */
router.post('/match/:matchId', authenticateAdmin, async (req, res) => {
  const startTime = Date.now();
  try {
    const { matchId } = req.params;
    const { results } = req.body; // Array of { marketId, result, winner }
    const adminId = req.user.id;

    logger.info(`🎯 [SETTLE] Starting match settlement for match: ${matchId}, admin: ${adminId}`);

    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: results (array of market results)'
      });
    }

    // Use Prisma transaction to ensure data consistency
    const settlementResult = await prisma.$transaction(async (tx) => {
      const matchSettlement = {
        matchId,
        totalMarkets: results.length,
        totalBets: 0,
        totalWinnings: 0,
        totalLosses: 0,
        marketResults: []
      };

      // Process each market
      for (const marketResult of results) {
        const { marketId, result, winner } = marketResult;

        // Get all pending bets for this market
        const pendingBets = await tx.bet.findMany({
          where: { 
            matchId: matchId,
            marketId: marketId,
            status: 'PENDING'
          },
          include: {
            user: {
              select: { id: true, balance: true, username: true }
            }
          }
        });

        if (pendingBets.length === 0) {
          continue; // Skip markets with no pending bets
        }

        let marketWinnings = 0;
        let marketLosses = 0;

        // Process each bet in the market
        for (const bet of pendingBets) {
          let betStatus = 'LOST';
          let profitLoss = 0;
          let isWinner = false;

          if (bet.selection === winner) {
            betStatus = 'WON';
            isWinner = true;
            
            if (bet.betType === 'back') {
              profitLoss = (bet.odds - 1) * bet.stake;
            } else {
              profitLoss = bet.stake;
            }
          } else {
            if (bet.betType === 'back') {
              profitLoss = -bet.stake;
            } else {
              profitLoss = -(bet.odds - 1) * bet.stake;
            }
          }

          // Update bet
          await tx.bet.update({
            where: { id: bet.id },
            data: {
              status: betStatus,
              profitLoss: profitLoss,
              settledAt: new Date()
            }
          });

          // No balance update needed
          await tx.user.update({
            where: { id: bet.user.id },
            data: { updatedAt: new Date() }
          });

          // Create ledger entry
          await tx.ledger.create({
            data: {
              userId: bet.user.id,
              matchId: matchId,
              marketId: marketId,
              betId: bet.id,
              type: isWinner ? 'BET_WIN' : 'BET_LOSS',
              amount: profitLoss
            }
          });

          if (isWinner) {
            marketWinnings += profitLoss;
          } else {
            marketLosses += Math.abs(profitLoss);
          }
        }

        // Update market status
        await tx.matchOdds.updateMany({
          where: { 
            matchId: matchId,
            marketId: marketId
          },
          data: { 
            status: 'SETTLED',
            lastUpdated: new Date()
          }
        });

        matchSettlement.totalBets += pendingBets.length;
        matchSettlement.totalWinnings += marketWinnings;
        matchSettlement.totalLosses += marketLosses;

        matchSettlement.marketResults.push({
          marketId,
          totalBets: pendingBets.length,
          winnings: marketWinnings,
          losses: marketLosses,
          result,
          winner
        });
      }

      // Update match status to completed
      await tx.match.update({
        where: { matchId: matchId },
        data: { 
          status: 'COMPLETED',
          result: JSON.stringify(results),
          settledAt: new Date(),
          lastUpdated: new Date()
        }
      });

      logger.info(`✅ [SETTLE] Match ${matchId} settled successfully. Total bets: ${matchSettlement.totalBets}`);

      return matchSettlement;
    });

    const responseTime = Date.now() - startTime;
    logger.info(`✅ [SETTLE] Match settlement completed in ${responseTime}ms`);

    res.json({
      success: true,
      message: 'Match settled successfully',
      data: settlementResult
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(`❌ [SETTLE] Match settlement failed in ${responseTime}ms: ${error.message}`);
    
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to settle match'
    });
  }
});

/**
 * GET /api/settle/test
 * Test endpoint to verify the route is working
 */
router.get('/test', (req, res) => {
  logger.info(`🧪 [SETTLE] Test endpoint called`);
  res.json({
    success: true,
    message: 'Settlement route is working',
    timestamp: new Date().toISOString(),
    route: '/api/settle/test'
  });
});

module.exports = router;
