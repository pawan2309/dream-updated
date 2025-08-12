"use strict";

const express = require("express");
const router = express.Router();

const { login, logout } = require("./authController");
const { verifyJwtToken } = require("./authMiddleware");
const { loginRateLimiter } = require("./rateLimiter");
const { auditLogin } = require("./auditLog");
const { requirePermission, requireSubdomainPolicy } = require("./rbac");
const database = require("../externalapi/utils/database");

// POST /auth/login
router.post("/login", loginRateLimiter, auditLogin, login);

// POST /auth/logout (protected if you want to require valid token to logout)
router.post("/logout", verifyJwtToken, logout);

// GET /auth/session - validate token and return user info
router.get(
  "/session",
  verifyJwtToken,
  (req, res) => res.json({
    authenticated: true,
    user: {
      id: req.user?.sub,
      role: req.user?.role,
      subdomain: req.user?.subdomain,
    },
  })
);

// Example guarded routes (backend-only RBAC)
router.get(
  "/control-panel/ping",
  verifyJwtToken,
  requireSubdomainPolicy(),
  requirePermission("controlPanel"),
  (req, res) => res.json({ ok: true, area: "control-panel" })
);

router.get(
  "/client/ping",
  verifyJwtToken,
  requireSubdomainPolicy(),
  requirePermission("clientPanel"),
  (req, res) => res.json({ ok: true, area: "client" })
);

// DB connectivity ping
router.get("/db-ping", async (_req, res) => {
  try {
    const ok = await database.ping();
    return res.status(ok ? 200 : 500).json({ database: ok ? "up" : "down" });
  } catch (_e) {
    return res.status(500).json({ database: "down" });
  }
});

module.exports = router;


