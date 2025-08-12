"use strict";

const jwt = require("jsonwebtoken");
const database = require("../externalapi/utils/database");
const roleMap = require("./roleMap");

/**
 * Extract the subdomain from a hostname.
 * Examples:
 * - admin.example.com -> admin
 * - api.dev.example.com -> api (treat first label as subdomain)
 * - admin.localhost -> admin
 * - localhost -> null
 */
function extractSubdomain(hostname) {
  if (!hostname || typeof hostname !== "string") return null;

  const hostWithoutPort = hostname.split(":")[0];
  const labels = hostWithoutPort.split(".").filter(Boolean);

  // localhost or bare domains (example.com)
  if (labels.length <= 1) return null;

  // admin.localhost or admin.example.com -> return first label
  return labels[0].toLowerCase();
}

function getRoleForSubdomain(subdomain) {
  if (!subdomain) return roleMap.default || "user";
  return roleMap[subdomain] || roleMap.default || "user";
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return secret;
}

function generateJwtToken(userId, role, subdomain) {
  const payload = { sub: userId, role, subdomain };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "1h" });
}

// Password hashing is not used; DB stores plain text per requirement

/**
 * Look up and verify the user using your persistence layer.
 * Replace this stub with your real implementation.
 *
 * Expected return shape on success:
 * { id: string|number, name: string, email: string, passwordHash: string }
 * Return null/undefined if the user is not found or not allowed.
 */
async function authenticateUser(identifier, plainPassword) {
  // NOTE: per requirement, password is stored as plain text in DB.
  // Updated to match actual database schema with username column
  const user = await database.findOne("users", { username: identifier }, [
    "id",
    "username",
    "password",
    "role",
  ]);

  if (!user) return null;

  // Plain text comparison as requested
  if (String(user.password) !== String(plainPassword)) return null;

  return {
    id: user.id,
    name: user.username, // Use username as name
    email: user.username, // Use username as email for compatibility
    role: user.role,
  };
}

module.exports = {
  extractSubdomain,
  getRoleForSubdomain,
  getJwtSecret,
  generateJwtToken,
  authenticateUser,
};


