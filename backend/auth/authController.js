"use strict";

const {
  extractSubdomain,
  getRoleForSubdomain,
  generateJwtToken,
  authenticateUser,
} = require("./authService");

async function login(req, res) {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ message: "identifier and password are required" });
    }

    const user = await authenticateUser(identifier, password);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const subdomain = extractSubdomain(req.hostname);
    const role = getRoleForSubdomain(subdomain);
    const token = generateJwtToken(user.id, role, subdomain);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        subdomain,
      },
    });
  } catch (error) {
    // Avoid leaking details
    return res.status(500).json({ message: "Login failed" });
  }
}

async function logout(_req, res) {
  // Stateless JWT: client should discard token. Optionally add to blacklist in future.
  return res.status(200).json({ message: "Logged out" });
}

module.exports = {
  login,
  logout,
};


