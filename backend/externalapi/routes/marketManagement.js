const express = require('express');
const router = express.Router();
const jwtAuth = require('../../shared/middleware/jwtAuth');
const MarketService = require('../services/marketService');

// GET /api/market/status/:matchId/:marketId - Get market status
router.get('/status/:matchId/:marketId', jwtAuth(), async (req, res) => {
  try {
    const { matchId, marketId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const marketStatus = await MarketService.getMarketStatus(matchId, marketId);
    
    if (marketStatus.error) {
      return res.status(404).json({
        success: false,
        error: marketStatus.error
      });
    }

    res.json({
      success: true,
      data: marketStatus
    });

  } catch (error) {
    console.error('❌ [MARKET] Error getting market status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get market status'
    });
  }
});

// POST /api/market/suspend/:matchId/:marketId - Suspend a market
router.post('/suspend/:matchId/:marketId', jwtAuth(), async (req, res) => {
  try {
    const { matchId, marketId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // TODO: Add admin role check here
    // For now, allow any authenticated user to suspend markets

    const result = await MarketService.suspendMarket(matchId, marketId, reason);
    
    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Market suspended successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ [MARKET] Error suspending market:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend market'
    });
  }
});

// POST /api/market/activate/:matchId/:marketId - Activate a suspended market
router.post('/activate/:matchId/:marketId', jwtAuth(), async (req, res) => {
  try {
    const { matchId, marketId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // TODO: Add admin role check here
    // For now, allow any authenticated user to activate markets

    const result = await MarketService.activateMarket(matchId, marketId);
    
    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Market activated successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ [MARKET] Error activating market:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate market'
    });
  }
});

// POST /api/market/close/:matchId/:marketId - Close a market
router.post('/close/:matchId/:marketId', jwtAuth(), async (req, res) => {
  try {
    const { matchId, marketId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // TODO: Add admin role check here
    // For now, allow any authenticated user to close markets

    const result = await MarketService.closeMarket(matchId, marketId);
    
    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Market closed successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ [MARKET] Error closing market:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close market'
    });
  }
});

// GET /api/market/match/:matchId - Get all markets for a match
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

    const markets = await MarketService.getMatchMarkets(matchId);
    
    res.json({
      success: true,
      data: markets
    });

  } catch (error) {
    console.error('❌ [MARKET] Error getting match markets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get match markets'
    });
  }
});

// POST /api/market/odds/:matchId/:marketId - Update market odds
router.post('/odds/:matchId/:marketId', jwtAuth(), async (req, res) => {
  try {
    const { matchId, marketId } = req.params;
    const { oddsData } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!oddsData) {
      return res.status(400).json({
        success: false,
        error: 'Odds data is required'
      });
    }

    // TODO: Add admin role check here
    // For now, allow any authenticated user to update odds

    const result = await MarketService.updateMarketOdds(matchId, marketId, oddsData);
    
    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Market odds updated successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ [MARKET] Error updating market odds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update market odds'
    });
  }
});

// GET /api/market/can-bet/:matchId/:marketId - Check if market can accept bets
router.get('/can-bet/:matchId/:marketId', jwtAuth(), async (req, res) => {
  try {
    const { matchId, marketId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const betStatus = await MarketService.canAcceptBets(matchId, marketId);
    
    res.json({
      success: true,
      data: betStatus
    });

  } catch (error) {
    console.error('❌ [MARKET] Error checking bet acceptance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check bet acceptance'
    });
  }
});

module.exports = router;
