const logger = require('../utils/logger');
const redis = require('../utils/redisClient');

async function getCasinoResultsSnapshot() {
  try {
    const data = await redis.get('casino:results');
    if (!data) return null;
    return Array.isArray(data) ? data : null;
  } catch (error) {
    logger.error('getCasinoResultsSnapshot error:', error);
    return null;
  }
}

module.exports = {
  getCasinoResultsSnapshot
};