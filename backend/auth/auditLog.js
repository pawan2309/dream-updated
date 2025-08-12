"use strict";

// Minimal audit logger for login attempts
// Replace with a persistent logger or DB sink as needed

function auditLogin(req, res, next) {
  const hostname = req.hostname;
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const when = new Date().toISOString();

  // Avoid logging credentials; only meta
  // eslint-disable-next-line no-console
  console.info(`[auth:audit] login attempt at ${when} from ${ip} host=${hostname}`);

  return next();
}

module.exports = {
  auditLogin,
};

