function toLowerSafe(value) {
  if (value == null) return null;
  return String(value).toLowerCase().trim();
}

function normalizeAllowed(list) {
  if (!Array.isArray(list)) return null;
  const normalized = list
    .map(toLowerSafe)
    .filter((v) => v && v.length > 0);
  return normalized.length ? new Set(normalized) : null;
}

function extractItemFields(item) {
  // sport can appear as sport or type
  const sport = toLowerSafe(item?.sport ?? item?.type);
  // league can appear as league or tournament
  const league = toLowerSafe(item?.league ?? item?.tournament);
  // game can appear as game, game_id, or name
  const game = toLowerSafe(item?.game ?? item?.game_id ?? item?.gameId ?? item?.name);
  return { sport, league, game };
}

function matchesAllowed(allowedSet, value) {
  if (!allowedSet) return true; // no filter configured
  if (!value) return false; // filter configured but value missing
  return allowedSet.has(value);
}

function filterByPanelSettings(data, settings = {}) {
  if (!Array.isArray(data) || data.length === 0) return Array.isArray(data) ? data : [];

  const allowedSports = normalizeAllowed(settings.allowedSports);
  const allowedLeagues = normalizeAllowed(settings.allowedLeagues);
  const allowedGames = normalizeAllowed(settings.allowedGames);

  // Fast path: no filters defined
  if (!allowedSports && !allowedLeagues && !allowedGames) return data;

  return data.filter((item) => {
    const { sport, league, game } = extractItemFields(item);

    if (!matchesAllowed(allowedSports, sport)) return false;
    if (!matchesAllowed(allowedLeagues, league)) return false;
    if (!matchesAllowed(allowedGames, game)) return false;

    return true;
  });
}

module.exports = { filterByPanelSettings };