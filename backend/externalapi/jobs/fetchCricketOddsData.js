const axios = require('axios');
const logger = require('../utils/logger');
const redis = require('../utils/redisClient');
const config = require('../../config');
const { publish } = require('../../shared/redisPubSub');

const BM_BASE_URL = config.api.cricketBM;
const TTL_SECONDS = config.ttl.cricketOdds;

function buildOddsRedisKey(eventId) {
  return `cricket:odds:${eventId}`;
}

async function fetchCricketOddsData(eventId) {
  if (!eventId) {
    logger.error('fetchCricketOddsData: eventId is required');
    return null;
  }

  const url = `${BM_BASE_URL}${encodeURIComponent(String(eventId))}`;
  const redisKey = buildOddsRedisKey(eventId);

  try {
    logger.info(`Fetching BM odds for eventId=${eventId}`);
    const { data } = await axios.get(url, { timeout: 10000 });

    const payload = data;

    await redis.set(redisKey, payload, TTL_SECONDS);
    await publish('cricket:odds:updated', { eventId, ts: Date.now() });
    logger.info(`Cached BM odds for eventId=${eventId} at key=${redisKey} (ttl=${TTL_SECONDS}s)`);

    return { eventId, cachedKey: redisKey, ttl: TTL_SECONDS };
  } catch (error) {
    logger.error(`fetchCricketOddsData failed for eventId=${eventId}: ${error.message}`);
    try {
      const stale = await redis.get(redisKey);
      if (stale) {
        return { eventId, cachedKey: redisKey, ttl: 0, meta: { stale: true, cachedAt: new Date().toISOString() } };
      }
    } catch (_) {}
    return null;
  }
}

module.exports = {
  fetchCricketOddsData,
  buildOddsRedisKey
};