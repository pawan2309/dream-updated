"use strict";

// Simple in-memory rate limiter for login route
// Limits: max X attempts per IP per Y milliseconds

const ATTEMPT_LIMIT = 10; // max attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const ipToAttempts = new Map();

function cleanupOld(now) {
  for (const [ip, attempts] of ipToAttempts.entries()) {
    const filtered = attempts.filter((ts) => now - ts < WINDOW_MS);
    if (filtered.length === 0) {
      ipToAttempts.delete(ip);
    } else {
      ipToAttempts.set(ip, filtered);
    }
  }
}

function loginRateLimiter(req, res, next) {
  const now = Date.now();
  const ip = req.ip || req.connection?.remoteAddress || "unknown";

  const attempts = ipToAttempts.get(ip) || [];
  const recent = attempts.filter((ts) => now - ts < WINDOW_MS);

  if (recent.length >= ATTEMPT_LIMIT) {
    return res.status(429).json({ message: "Too many login attempts. Please try again later." });
  }

  // record this attempt timestamp ahead of processing
  recent.push(now);
  ipToAttempts.set(ip, recent);

  // opportunistic cleanup
  if (ipToAttempts.size % 50 === 0) cleanupOld(now);

  return next();
}

module.exports = {
  loginRateLimiter,
};

