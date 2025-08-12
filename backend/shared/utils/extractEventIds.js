function isUuidLike(value) {
  if (typeof value !== 'string') return false;
  // Basic UUID v4 pattern (lenient)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function coerceId(val) {
  if (val == null) return null;
  if (typeof val === 'number' && Number.isFinite(val)) return String(val);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.length === 0) return null;
    // Accept numeric-like strings or uuid-like strings
    if (!Number.isNaN(Number(trimmed)) || isUuidLike(trimmed)) return trimmed;
    // Otherwise accept as-is
    return trimmed;
  }
  return null;
}

function extractEventIds(fixtures) {
  const result = new Set();
  if (!Array.isArray(fixtures)) return result;

  for (const item of fixtures) {
    if (!item || typeof item !== 'object') continue;

    let val = (
      item.eventId ??
      item.event_id ??
      item.external_id ??
      item.match_id ??
      item.matchId ??
      item.id
    );
    const coerced = coerceId(val);
    if (coerced) result.add(coerced);
  }

  return result;
}

module.exports = { extractEventIds };