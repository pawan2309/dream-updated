"use strict";

const { extractSubdomain } = require("./authService");

// Central role hierarchy (highest → lowest)
// Normalized to lowercase. We accept any case on input and normalize.
const roleHierarchy = [
  "owner",
  "sub_owner",
  "super_admin",
  "admin",
  "sub",
  "master",
  "super_agent",
  "agent",
  "user",
];

function roleRank(role) {
  const idx = roleHierarchy.indexOf(String(role || "").toLowerCase());
  return idx === -1 ? Number.POSITIVE_INFINITY : idx;
}

function isAtLeast(actualRole, minimumRole) {
  return roleRank(actualRole) <= roleRank(minimumRole);
}

// Permission → allowed roles map
const permissions = {
  // Control panel is OWNER only
  controlPanel: ["owner"],
  // Client area is only for client low/end user per requirement
  clientPanel: ["user"],
};

// Subdomain → allowed roles map (optional stronger gate)
// Adjust keys to match your subdomains
const subdomainPolicies = {
  // Control panel domain
  owner: permissions.controlPanel,
  // Root domain (no subdomain) maps to client panel policies implicitly via role
};

function requireRoles(allowedRoles) {
  return function (req, res, next) {
    const userRole = String(req.user?.role || "").toLowerCase();
    if (!userRole) return res.status(403).json({ message: "Forbidden" });
    const ok = allowedRoles.map((r) => String(r).toLowerCase()).includes(userRole);
    return ok ? next() : res.status(403).json({ message: "Forbidden" });
  };
}

function requirePermission(permissionKey) {
  const allowed = permissions[permissionKey] || [];
  return requireRoles(allowed);
}

function requireSubdomainPolicy() {
  return function (req, res, next) {
    const sub = extractSubdomain(req.hostname) || req.user?.subdomain;
    if (!sub) return next(); // if no subdomain, skip
    const allowed = subdomainPolicies[sub];
    if (!allowed) return next(); // no explicit policy, allow
    const userRole = String(req.user?.role || "").toLowerCase();
    if (!userRole) return res.status(403).json({ message: "Forbidden" });
    return allowed.includes(userRole) ? next() : res.status(403).json({ message: "Forbidden" });
  };
}

module.exports = {
  roleHierarchy,
  roleRank,
  isAtLeast,
  permissions,
  subdomainPolicies,
  requireRoles,
  requirePermission,
  requireSubdomainPolicy,
};

