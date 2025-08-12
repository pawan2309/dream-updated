const logger = require('../utils/logger');
const redis = require('../utils/redisClient');
const { filterByPanelSettings } = require('../../shared/utils/filterByPanelSettings');

async function getCricketFixturesSnapshot() {
  try {
    const data = await redis.get('cricket:fixtures');
    if (!data) return null;
    return Array.isArray(data) ? data : null;
  } catch (error) {
    logger.error('getCricketFixturesSnapshot error:', error);
    return null;
  }
}

function filterFixturesByPanelSettings(fixtures, settings) {
  try {
    if (!Array.isArray(fixtures)) return [];
    return filterByPanelSettings(fixtures, settings || {});
  } catch (error) {
    logger.error('filterFixturesByPanelSettings error:', error);
    return fixtures || [];
  }
}

module.exports = {
  getCricketFixturesSnapshot,
  filterFixturesByPanelSettings
};