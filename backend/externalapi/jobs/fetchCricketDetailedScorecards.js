const logger = require('../utils/logger');
const { get: httpGet } = require('../utils/apiFetcher');
const redis = require('../utils/redisClient');
const { publish } = require('../../shared/redisPubSub');

// Base endpoint. Append the eventId query param to this URL.
const BASE_URL = process.env.CRICKET_DETAILED_SCORECARD_URL || 'https://data.shamexch.xyz/getscorecard?eventId=';
const TTL_SECONDS = parseInt(process.env.CRICKET_DETAILED_SCORECARD_TTL || '60', 10);

function buildRedisKey(eventId) {
  return `cricket:scorecard:detailed:${eventId}`;
}

async function fetchCricketDetailedScorecards(eventId) {
  if (!eventId) {
    const err = new Error('eventId is required for detailed scorecard fetch');
    logger.error(err.message);
    throw err;
  }

  const url = `${BASE_URL}${encodeURIComponent(String(eventId))}`;
  logger.info(`Fetching detailed scorecard for eventId=${eventId}`);

  try {
    const { data } = await httpGet(url, { timeout: 10000, retries: 2 });

    const redisKey = buildRedisKey(eventId);
    await redis.set(redisKey, data, TTL_SECONDS);
    await publish('cricket:scorecard:detailed:updated', { eventId, ts: Date.now() });

    logger.info(`Cached detailed scorecard in Redis key=${redisKey} (ttl=${TTL_SECONDS}s)`);
    return { eventId, cachedKey: redisKey, ttl: TTL_SECONDS };
  } catch (error) {
    logger.error(`Failed to fetch detailed scorecard for eventId=${eventId}:`, error);
    try {
      const stale = await redis.get(buildRedisKey(eventId));
      if (stale) {
        return { eventId, cachedKey: buildRedisKey(eventId), ttl: 0, meta: { stale: true, cachedAt: new Date().toISOString() } };
      }
    } catch (_) {}
    throw error;
  }
}

module.exports = {
  fetchCricketDetailedScorecards,
  buildRedisKey
};