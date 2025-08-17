"use strict";

const jwt = require("jsonwebtoken");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return secret;
}

function parseBearerToken(headerValue) {
  if (!headerValue) return null;
  const parts = headerValue.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return null;
}

function verifyJwtToken(req, res, next) {
  try {
    console.log('🔍 [JWT] Authorization header:', req.headers["authorization"]?.substring(0, 50) + '...');
    
    const token = parseBearerToken(req.headers["authorization"]); 
    if (!token) {
      console.log('❌ [JWT] No token found in Authorization header');
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    console.log('🔍 [JWT] Token extracted:', token.substring(0, 50) + '...');
    
    const payload = jwt.verify(token, getJwtSecret());
    console.log('✅ [JWT] Token verified successfully, payload:', {
      sub: payload.sub,
      role: payload.role,
      subdomain: payload.subdomain
    });
    
    req.user = payload; // { sub, role, subdomain, iat, exp }
    return next();
  } catch (error) {
    console.error('❌ [JWT] Token verification failed:', error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireRole(allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const hasAccess = Array.isArray(allowedRoles)
      ? allowedRoles.includes(req.user.role)
      : req.user.role === allowedRoles;
    if (!hasAccess) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

module.exports = {
  verifyJwtToken,
  requireRole,
};


