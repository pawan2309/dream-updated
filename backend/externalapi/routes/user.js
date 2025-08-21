const express = require('express');
const router = express.Router();
const database = require('../utils/database');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const config = require('../../config');

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
 * GET /api/user/balance
 * Get user's current credit limit and exposure
 */
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    // Extract username from JWT (same logic as bet.js)
    const username = req.user.username || req.user.sub || req.user.id || req.user.userId;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username not found in token'
      });
    }

    // Find user by username first, then code
    logger.info(`🔍 [BALANCE] Looking up user with username: ${username}`);
    let user = await database.findOne('User', { username: username }, ['id', 'username', 'creditLimit', 'exposure']);
    
    if (!user) {
      logger.info(`🔍 [BALANCE] User not found by username, trying code: ${username}`);
      user = await database.findOne('User', { code: username }, ['id', 'username', 'code', 'creditLimit', 'exposure']);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const response = {
      success: true,
      balance: user.creditLimit || 0,
      creditLimit: user.creditLimit || 0,
      exposure: user.exposure || 0,
      message: 'User balance retrieved successfully'
    };
    
    logger.info(`🔍 [BALANCE] Sending response: ${JSON.stringify(response)}`);
    res.json(response);

  } catch (error) {
    logger.error(`❌ [USER] Failed to get user balance: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get user balance'
    });
  }
});

module.exports = router;
