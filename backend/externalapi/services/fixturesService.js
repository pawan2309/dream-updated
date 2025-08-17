const logger = require('../utils/logger');
const redis = require('../utils/redisClient');
const { filterByPanelSettings } = require('../../shared/utils/filterByPanelSettings');
const { normalizeFixtureId } = require('../utils/normalizeFixtureId');

async function getCricketFixturesSnapshot() {
  try {
    console.log('🏏 Fixtures service: Attempting to get cricket fixtures from cache...');
    
    // Use consistent cache key
    const cacheKey = 'cricket:fixtures';
    
    // Check if Redis is connected
    if (!redis.isConnected) {
      console.log('🔄 Fixtures service: Redis not connected, attempting to connect...');
      await redis.connect();
    }
    
    // Get data from cache first
    const data = await redis.get(cacheKey);
    console.log(`🔍 Fixtures service: Retrieved data from cache key '${cacheKey}':`, {
      hasData: !!data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      length: data ? data.length : 0
    });
    
    if (data && Array.isArray(data) && data.length > 0) {
      console.log(`✅ Fixtures service: Successfully retrieved ${data.length} fixtures from cache`);
      return data;
    }
    
    // Cache miss - try to get from individual fixture keys
    console.log('🏏 Fixtures service: Cache miss, trying individual fixture keys...');
    const individualKeys = await redis.keys('fixture:*');
    
    if (individualKeys.length > 0) {
      console.log(`🔍 Fixtures service: Found ${individualKeys.length} individual fixture keys`);
      const fixtures = [];
      
      for (const key of individualKeys) {
        const fixture = await redis.get(key);
        if (fixture) {
          fixtures.push(fixture);
        }
      }
      
      if (fixtures.length > 0) {
        console.log(`✅ Fixtures service: Reconstructed ${fixtures.length} fixtures from individual keys`);
        // Refresh the main cache
        await redis.set(cacheKey, fixtures, 300); // 5 minutes TTL
        return fixtures;
      }
    }
    
    console.log('🏏 Fixtures service: No fixtures found in cache or individual keys, returning null');
    return null;
    
  } catch (error) {
    logger.error('❌ Fixtures service: getCricketFixturesSnapshot error:', error);
    console.error('❌ Fixtures service: Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
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