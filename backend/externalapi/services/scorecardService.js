const logger = require('../utils/logger');
const redis = require('../utils/redisClient');
const { buildRedisKey } = require('../jobs/fetchCricketDetailedScorecards');

async function getDetailedScorecardSnapshot(eventId) {
  if (!eventId) return null;
  try {
    const key = buildRedisKey(eventId);
    const data = await redis.get(key);
    return data ?? null;
  } catch (error) {
    logger.error(`getDetailedScorecardSnapshot error for eventId=${eventId}:`, error);
    return null;
  }
}

module.exports = {
  getDetailedScorecardSnapshot
};