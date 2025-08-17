const axios = require('axios');
const logger = require('../utils/logger');
const redis = require('../utils/redisClient');
const { normalizeFixtureId } = require('../utils/normalizeFixtureId');

// -----------------------------------------------------------------------------
// Cricket Fixtures Cache Service
// -----------------------------------------------------------------------------
// This module is responsible for keeping the cricket fixtures cache (`cricket:fixtures`)
// up-to-date. It obeys the following rules:
//   1. The dashboard (and any other consumers) ALWAYS read from Redis – never from
//      the upstream provider.
//   2. Old cached data is retained until a *successful* refresh fetches new data.
//      If the upstream provider is down, consumers continue to receive the last
//      good snapshot.
//   3. Data is refreshed in the background every 30 seconds using `setInterval`.
//   4. On cold-start if the cache is empty the service performs an *immediate*
//      fetch so that the dashboard is never served an empty array (unless the
//      provider explicitly returns an empty array).
//   5. All operations use async/await and include detailed error handling & logs.
// -----------------------------------------------------------------------------

// Redis cache details
const CACHE_KEY = 'cricket:fixtures';
const REDIS_TTL_SECONDS = 300;           // Keep a 5 minute TTL as a safety net

// Refresh scheduler details
const REFRESH_INTERVAL_MS = 30 * 1000;   // 30 seconds
let intervalHandle = null;               // So we can clear it on shutdown if needed
let isRefreshing = false;                // Prevent overlapping refreshes

// Upstream provider URL – make configurable via env but fall back to sensible default
const UPSTREAM_URL = process.env.CRICKET_FIXTURES_URL ||
                     'https://marketsarket.qnsports.live/cricketmatches';

/**
 * Perform the HTTP request to the upstream provider and normalise the response.
 *
 * @returns {Promise<Array>} The array of *normalised* fixtures. May be empty
 *                           (the only case where we deliberately allow an
 *                           empty cache write).
 */
async function fetchFromProvider () {
  logger.info(`[fixtures-cache] Fetching fixtures from upstream: ${UPSTREAM_URL}`);

  const response = await axios.get(UPSTREAM_URL, { timeout: 15000 });

  if (response.status !== 200) {
    throw new Error(`Upstream responded with HTTP ${response.status}`);
  }

  // The upstream may return either an array directly         ->  [...]
  // or an object wrapper with a property (e.g. t1, data, etc) ->  { t1: [...] }
  const raw = Array.isArray(response.data)
    ? response.data
    : (response.data && Array.isArray(response.data.t1) ? response.data.t1 : []);

  logger.info(`[fixtures-cache] Upstream returned ${raw.length} fixture records`);

  // Normalise & dedupe (if needed)
  const seenIds = new Set();
  const normalised = [];

  for (const fixture of raw) {
    try {
      const id = normalizeFixtureId(fixture);
      if (!id) {
        logger.warn('[fixtures-cache] Skipping fixture with no resolvable ID');
        continue;
      }

      if (seenIds.has(id)) {
        continue; // skip duplicates
      }
      seenIds.add(id);

      normalised.push({
        id,
        raw: fixture
      });
    } catch (err) {
      // Never let a single bad record blow up the whole refresh
      logger.warn('[fixtures-cache] Failed to normalise fixture – skipping', err);
    }
  }

  return normalised;
}

/**
 * Refresh the cache – only writes to Redis *after* a successful fetch.
 */
async function refreshCache () {
  // Prevent overlapping executions – important if a fetch is slow (> interval)
  if (isRefreshing) {
    logger.warn('[fixtures-cache] Skipping refresh – previous run still in progress');
    return;
  }
  isRefreshing = true;

  try {
    const fixtures = await fetchFromProvider();

    // At this point the fetch was successful – write to Redis even if empty to
    // reflect the true upstream state (requirement #2 & #3).
    await redis.set(CACHE_KEY, fixtures, REDIS_TTL_SECONDS);

    logger.info(`[fixtures-cache] Cache updated – ${fixtures.length} fixtures cached`);
  } catch (err) {
    // Log & swallow – keep old cache intact
    logger.error('[fixtures-cache] Refresh failed – using existing cached data', err);
  } finally {
    isRefreshing = false;
  }
}

/**
 * Initialise the cache service.
 */
async function startCricketFixturesCache () {
  // Ensure we only start once
  if (intervalHandle) {
    return; // already running
  }

  // Make sure Redis is connected – attempt connect if not
  if (!redis.isConnected) {
    logger.info('[fixtures-cache] Redis not connected – attempting to connect');
    await redis.connect();
  }

  // 1. Cold-start fill – if the key does NOT exist or holds no data, fetch now.
  try {
    const existing = await redis.get(CACHE_KEY);
    if (!existing || (Array.isArray(existing) && existing.length === 0)) {
      logger.info('[fixtures-cache] Cache empty on start – performing immediate fetch');
      await refreshCache();
    } else {
      logger.info(`[fixtures-cache] Cache already has ${existing.length} fixtures on start`);
    }
  } catch (err) {
    logger.error('[fixtures-cache] Failed to check existing cache on start', err);
  }

  // 2. Start background interval
  intervalHandle = setInterval(refreshCache, REFRESH_INTERVAL_MS);
  intervalHandle.unref(); // Do not hold the Node process open just for the interval

  logger.info('[fixtures-cache] Background refresh scheduled every 30 seconds');
}

module.exports = {
  startCricketFixturesCache
};
