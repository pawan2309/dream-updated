const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Simple POC authentication - in production, use proper user management
const POC_USERS = {
  'poc_user': {
    id: 'poc_user_001',
    username: 'poc_user',
    role: 'user',
    permissions: ['read_matches', 'place_bets', 'view_odds']
  },
  'admin_user': {
    id: 'admin_001', 
    username: 'admin_user',
    role: 'admin',
    permissions: ['read_matches', 'place_bets', 'view_odds', 'manage_bets', 'view_reports']
  }
};

// Generate JWT token for POC
function generatePocToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    permissions: user.permissions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const secret = process.env.JWT_SECRET || 'poc_secret_key_change_in_production';
  return jwt.sign(payload, secret);
}

// POST /public-auth/login - POC authentication endpoint
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple POC validation - in production, use proper authentication
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // POC user validation
    const user = POC_USERS[username];
    if (!user || password !== 'poc123') { // Simple password for POC
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generatePocToken(user);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          permissions: user.permissions
        },
        token,
        expiresIn: '24h'
      },
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('POC auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// GET /public-auth/validate - Validate existing token
router.get('/validate', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'poc_secret_key_change_in_production';
    
    try {
      const payload = jwt.verify(token, secret);
      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            id: payload.userId,
            username: payload.username,
            role: payload.role,
            permissions: payload.permissions
          }
        }
      });
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed'
    });
  }
});

// GET /public-auth/users - List available POC users (for testing)
router.get('/users', (req, res) => {
  const users = Object.keys(POC_USERS).map(username => ({
    username,
    role: POC_USERS[username].role,
    permissions: POC_USERS[username].permissions
  }));
  
  res.json({
    success: true,
    data: users,
    message: 'Available POC users',
    note: 'Use password: poc123 for all users'
  });
});

module.exports = router;
