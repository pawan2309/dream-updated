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
  async (req, res) => {
    try {
      // Get user ID from JWT token
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Invalid token - no user ID found"
        });
      }

      // Fetch user data from database using user ID from JWT
      const user = await database.findOne("User", { id: userId });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "User not found in database"
        });
      }

      // Return user data including chips (creditLimit)
      return res.json({
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          subdomain: req.user?.subdomain,
          creditLimit: user.creditLimit || 0,
          exposure: user.exposure || 0,

        },
      });
    } catch (error) {
      console.error("Error in session endpoint:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch user data"
      });
    }
  }
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


