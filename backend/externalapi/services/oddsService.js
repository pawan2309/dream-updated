const logger = require('../utils/logger');
const redis = require('../utils/redisClient');
const { buildOddsRedisKey } = require('../jobs/fetchCricketOddsData');

async function getOddsSnapshot(eventId) {
  if (!eventId) return null;
  try {
    const key = buildOddsRedisKey(eventId);
    const data = await redis.get(key);
    return data ?? null;
  } catch (error) {
    logger.error(`getOddsSnapshot error for eventId=${eventId}:`, error);
    return null;
  }
}

module.exports = {
  getOddsSnapshot
};