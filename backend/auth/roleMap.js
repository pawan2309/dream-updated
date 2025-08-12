"use strict";

// Map subdomain slug -> backend role (lowercase, matches rbac.js)
// Plan: {role}.batxgames.site for all except USER (root domain)
// Keys are quoted consistently. Include aliases without hyphens for convenience.
module.exports = {
  "owner": "owner",                 // owner.batxgames.site → OWNER (control panel)

  // User management panels
  "sub-owner": "sub_owner",
  "subowner": "sub_owner",
  "super-admin": "super_admin",
  "superadmin": "super_admin",
  "admin": "admin",
  "sub": "sub",
  "master": "master",
  "super-agent": "super_agent",
  "superagent": "super_agent",
  "agent": "agent",

  // Root domain maps to USER by default
  "default": "user",
};

