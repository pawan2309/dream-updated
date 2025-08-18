// Utility to generate a normalized, consistent fixture ID
// Rules:
// 1. Prefer fixture.beventId if it exists.
// 2. Otherwise, use fixture.id or fixture.eventId directly without prefixing.
// 3. If neither exists, return null.

function normalizeFixtureId(fixture) {
  if (!fixture || typeof fixture !== 'object') return null;

  // 1. Prefer beventId when available
  if (fixture.beventId) {
    return String(fixture.beventId);
  }

  // 2. Use eventId if available (this is the actual external API ID)
  if (fixture.eventId) {
    return String(fixture.eventId);
  }

  // 3. Use fixture.id if available
  if (fixture.id !== undefined && fixture.id !== null) {
    return String(fixture.id);
  }

  // 4. Ultimate fallback – return null instead of generating a fake ID
  return null;
}

module.exports = {
  normalizeFixtureId,
};
