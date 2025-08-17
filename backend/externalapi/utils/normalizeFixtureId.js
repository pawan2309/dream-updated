// Utility to generate a normalized, consistent fixture ID
// Rules:
// 1. Prefer fixture.beventId if it exists.
// 2. Otherwise, take fixture.id, remove any non-digit characters (so 1.246578071 -> 1246578071).
//    Then return it prefixed with "prov-".
// 3. If neither beventId nor id exists, return null.

function normalizeFixtureId(fixture) {
  if (!fixture || typeof fixture !== 'object') return null;

  // 1. Prefer beventId when available
  if (fixture.beventId) {
    return String(fixture.beventId);
  }

  // 2. Otherwise use fixture.id:
  //    a. Convert to string
  //    b. Remove ALL non-digit characters (so "1.246578071" -> "1246578071")
  //    c. Prefix the cleaned numeric string with "prov-" for consistency
  if (fixture.id !== undefined && fixture.id !== null) {
    const cleanedId = String(fixture.id).replace(/[^0-9]/g, "");
    return `prov-${cleanedId}`;
  }

  // 3. Ultimate fallback – ensure we still return something unique-ish
  return `prov-${Date.now()}`;
}

module.exports = {
  normalizeFixtureId,
};
