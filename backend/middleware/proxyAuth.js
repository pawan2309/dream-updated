const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Proxy Authentication Middleware
 * Handles JWT and API key authentication for proxy requests
 */

/**
 * JWT Authentication middleware
 */
function jwtAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: {
          code: 'MISSING_AUTH_HEADER',
          message: 'Authorization header is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'JWT token is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Add user info to request
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
      tokenType: 'jwt'
    };

    next();
  } catch (error) {
    let errorCode = 'INVALID_TOKEN';
    let message = 'Invalid JWT token';

    if (error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      message = 'JWT token has expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = 'MALFORMED_TOKEN';
      message = 'Malformed JWT token';
    }

    return res.status(401).json({
      error: {
        code: errorCode,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * API Key Authentication middleware
 */
function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate API key format (basic validation)
    if (apiKey.length < 32) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY_FORMAT',
          message: 'Invalid API key format',
          timestamp: new Date().toISOString()
        }
      });
    }

    // In a real implementation, you would validate against a database
    // For now, we'll use a simple validation
    const validApiKeys = process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : [];
    
    if (validApiKeys.length > 0 && !validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Add service info to request
    req.user = {
      id: 'service-' + apiKey.slice(-8),
      type: 'service',
      role: 'service',
      permissions: ['proxy:access'],
      tokenType: 'apiKey'
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * Combined authentication middleware (JWT or API Key)
 */
function authenticate(req, res, next) {
  // Check if JWT token is present
  if (req.headers.authorization) {
    return jwtAuth(req, res, next);
  }
  
  // Check if API key is present
  if (req.headers['x-api-key'] || req.query.apiKey) {
    return apiKeyAuth(req, res, next);
  }
  
  // No authentication provided
  return res.status(401).json({
    error: {
      code: 'NO_AUTH_PROVIDED',
      message: 'Authentication required. Provide JWT token or API key',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Authorization middleware for provider access
 */
function authorizeProvider(req, res, next) {
  try {
    const { provider } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'USER_NOT_AUTHENTICATED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Service accounts have access to all providers
    if (user.type === 'service') {
      return next();
    }

    // Admin users have access to all providers
    if (user.role === 'admin') {
      return next();
    }

    // Check specific provider permissions
    const requiredPermission = `provider:${provider}:access`;
    if (user.permissions && user.permissions.includes(requiredPermission)) {
      return next();
    }

    // Check general proxy access permission
    if (user.permissions && user.permissions.includes('proxy:access')) {
      return next();
    }

    return res.status(403).json({
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied for provider: ${provider}`,
        requiredPermission,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'Authorization check failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * Request validation middleware
 */
function validateRequest(req, res, next) {
  try {
    const { provider } = req.params;
    const { endpoint } = req.body;

    // Validate provider parameter
    if (!provider || typeof provider !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_PROVIDER',
          message: 'Provider parameter is required and must be a string',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate endpoint in request body
    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_ENDPOINT',
          message: 'Endpoint is required in request body and must be a string',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate HTTP method
    const method = req.body.method || 'GET';
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(method.toUpperCase())) {
      return res.status(400).json({
        error: {
          code: 'INVALID_METHOD',
          message: `Invalid HTTP method. Allowed: ${validMethods.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Sanitize provider and endpoint
    req.params.provider = provider.toLowerCase().replace(/[^a-z0-9-]/g, '');
    req.body.endpoint = endpoint.replace(/[^a-zA-Z0-9\-_\/\?&=.]/g, '');

    next();
  } catch (error) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * Rate limiting middleware factory
 */
function createRateLimit(windowMs = 60000, max = 100, message = 'Too many requests') {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if available, otherwise fall back to IP
      return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    },
    skip: (req) => {
      // Skip rate limiting for admin users
      return req.user && req.user.role === 'admin';
    }
  });
}

/**
 * Provider-specific rate limiting middleware
 */
function providerRateLimit(providerConfig) {
  if (!providerConfig.rateLimit) {
    return (req, res, next) => next(); // No rate limiting
  }

  const { windowMs, max } = providerConfig.rateLimit;
  return createRateLimit(
    windowMs,
    max,
    `Rate limit exceeded for provider: ${providerConfig.id}`
  );
}

/**
 * Global rate limiting middleware
 */
const globalRateLimit = createRateLimit(
  60000, // 1 minute
  200,   // 200 requests per minute
  'Global rate limit exceeded'
);

/**
 * Logging middleware for authentication events
 */
function logAuthEvents(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log authentication failures
    if (res.statusCode === 401 || res.statusCode === 403) {
      const logger = require('../externalapi/utils/logger');
      logger.warn('Authentication/Authorization failure', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        user: req.user ? req.user.id : 'anonymous'
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

module.exports = {
  authenticate,
  jwtAuth,
  apiKeyAuth,
  authorizeProvider,
  validateRequest,
  createRateLimit,
  providerRateLimit,
  globalRateLimit,
  logAuthEvents
};