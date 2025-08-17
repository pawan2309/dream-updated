const redis = require('../utils/redisClient');
const logger = require('../utils/logger');

/**
 * Redis Service for Live Sports Fixtures
 * Manages live (in-play) matches with TTL for real-time access
 */
class RedisService {
  constructor() {
    this.redis = redis;
    this.liveFixturesKey = 'fixtures:live:list';
    this.liveFixturesSetKey = 'fixtures:live:set';
  }

  /**
   * Store a fixture in Redis with TTL
   * @param {string} key - Redis key (e.g., 'live:bevent:12345')
   * @param {Object} fixture - Fixture data to store
   * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
   */
  async setFixture(key, fixture, ttl = 300) {
    try {
      const serializedFixture = JSON.stringify(fixture);
      await this.redis.set(key, serializedFixture, 'EX', ttl);
      
      logger.debug(`✅ Stored fixture in Redis`, { 
        key, 
        ttl, 
        beventId: fixture.beventId,
        bmarketId: fixture.bmarketId 
      });
      
      return true;
    } catch (error) {
      logger.error(`❌ Failed to store fixture in Redis`, { key, error: error.message });
      throw error;
    }
  }

  /**
   * Retrieve a fixture from Redis by key
   * @param {string} key - Redis key
   * @returns {Object|null} - Fixture data or null if not found/expired
   */
  async getFixture(key) {
    try {
      const data = await this.redis.get(key);
      
      if (!data) {
        logger.debug(`ℹ️ Fixture not found in Redis`, { key });
        return null;
      }
      
      const fixture = JSON.parse(data);
      logger.debug(`✅ Retrieved fixture from Redis`, { key, beventId: fixture.beventId });
      
      return fixture;
    } catch (error) {
      logger.error(`❌ Failed to retrieve fixture from Redis`, { key, error: error.message });
      return null;
    }
  }

  /**
   * Add fixture to live fixtures list with TTL
   * Maintains a sorted list of all live fixtures
   * @param {Object} fixture - Fixture data
   * @param {number} ttl - Time to live in seconds
   */
  async addToLiveFixturesList(fixture, ttl = 300) {
    try {
      const fixtureKey = `fixture:${fixture.beventId || fixture.bmarketId}`;
      const serializedFixture = JSON.stringify(fixture);
      
      // Store individual fixture
      await this.redis.set(fixtureKey, serializedFixture, 'EX', ttl);
      
      // Add to live fixtures set (for quick lookup)
      await this.redis.sadd(this.liveFixturesSetKey, fixtureKey);
      
      // Add to live fixtures list (for ordered retrieval)
      await this.redis.lpush(this.liveFixturesKey, fixtureKey);
      
      // Set TTL for the list and set
      await this.redis.expire(this.liveFixturesKey, ttl);
      await this.redis.expire(this.liveFixturesSetKey, ttl);
      
      logger.debug(`✅ Added fixture to live fixtures list`, { 
        fixtureKey, 
        beventId: fixture.beventId,
        ttl 
      });
      
      return true;
    } catch (error) {
      logger.error(`❌ Failed to add fixture to live fixtures list`, { 
        beventId: fixture.beventId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get all live fixtures from Redis
   * @returns {Array} - Array of live fixture objects
   */
  async getAllLiveFixtures() {
    try {
      // Get all fixture keys from the set
      const fixtureKeys = await this.redis.smembers(this.liveFixturesSetKey);
      
      if (fixtureKeys.length === 0) {
        logger.debug('ℹ️ No live fixtures found in Redis');
        return [];
      }
      
      // Retrieve all fixtures
      const fixtures = [];
      for (const key of fixtureKeys) {
        try {
          const fixture = await this.getFixture(key);
          if (fixture) {
            fixtures.push(fixture);
          }
        } catch (error) {
          logger.warn(`⚠️ Failed to retrieve fixture`, { key, error: error.message });
        }
      }
      
      logger.debug(`✅ Retrieved ${fixtures.length} live fixtures from Redis`);
      return fixtures;
      
    } catch (error) {
      logger.error(`❌ Failed to get all live fixtures`, { error: error.message });
      return [];
    }
  }

  /**
   * Get live fixture by beventId
   * @param {string} beventId - Event ID to search for
   * @returns {Object|null} - Fixture data or null if not found
   */
  async getLiveFixtureByBeventId(beventId) {
    try {
      const key = `live:bevent:${beventId}`;
      const fixture = await this.getFixture(key);
      
      if (fixture) {
        logger.debug(`✅ Retrieved live fixture by beventId`, { beventId });
        return fixture;
      }
      
      return null;
    } catch (error) {
      logger.error(`❌ Failed to get live fixture by beventId`, { beventId, error: error.message });
      return null;
    }
  }

  /**
   * Get live fixture by bmarketId
   * @param {string} bmarketId - Market ID to search for
   * @returns {Object|null} - Fixture data or null if not found
   */
  async getLiveFixtureByBmarketId(bmarketId) {
    try {
      const key = `live:bmarket:${bmarketId}`;
      const fixture = await this.getFixture(key);
      
      if (fixture) {
        logger.debug(`✅ Retrieved live fixture by bmarketId`, { bmarketId });
        return fixture;
      }
      
      return null;
    } catch (error) {
      logger.error(`❌ Failed to get live fixture by bmarketId`, { bmarketId, error: error.message });
      return null;
    }
    }

  /**
   * Remove fixture from live fixtures
   * @param {string} beventId - Event ID of fixture to remove
   * @param {string} bmarketId - Market ID of fixture to remove
   */
  async removeLiveFixture(beventId, bmarketId) {
    try {
      const keysToRemove = [];
      
      if (beventId) {
        keysToRemove.push(`live:bevent:${beventId}`);
      }
      
      if (bmarketId) {
        keysToRemove.push(`live:bmarket:${bmarketId}`);
      }
      
      if (keysToRemove.length > 0) {
        await this.redis.del(...keysToRemove);
        logger.debug(`✅ Removed live fixture keys`, { keysToRemove });
      }
      
      // Remove from live fixtures set and list
      const fixtureKey = `fixture:${beventId || bmarketId}`;
      await this.redis.srem(this.liveFixturesSetKey, fixtureKey);
      await this.redis.lrem(this.liveFixturesKey, 0, fixtureKey);
      
      logger.debug(`✅ Removed fixture from live fixtures collections`, { fixtureKey });
      
      return true;
    } catch (error) {
      logger.error(`❌ Failed to remove live fixture`, { beventId, bmarketId, error: error.message });
      throw error;
    }
  }

  /**
   * Clean up expired live fixtures
   * Removes fixtures that are no longer live
   */
  async cleanupExpiredLiveFixtures() {
    try {
      const fixtureKeys = await this.redis.smembers(this.liveFixturesSetKey);
      let cleanedCount = 0;
      
      for (const key of fixtureKeys) {
        try {
          const exists = await this.redis.exists(key);
          if (!exists) {
            // Remove from set and list
            await this.redis.srem(this.liveFixturesSetKey, key);
            await this.redis.lrem(this.liveFixturesKey, 0, key);
            cleanedCount++;
          }
        } catch (error) {
          logger.warn(`⚠️ Error checking fixture key`, { key, error: error.message });
        }
      }
      
      if (cleanedCount > 0) {
        logger.info(`🧹 Cleaned up ${cleanedCount} expired live fixtures`);
      }
      
      return cleanedCount;
    } catch (error) {
      logger.error(`❌ Failed to cleanup expired live fixtures`, { error: error.message });
      return 0;
    }
  }

  /**
   * Get live fixtures count
   * @returns {number} - Number of live fixtures
   */
  async getLiveFixturesCount() {
    try {
      const count = await this.redis.scard(this.liveFixturesSetKey);
      return count;
    } catch (error) {
      logger.error(`❌ Failed to get live fixtures count`, { error: error.message });
      return 0;
    }
  }

  /**
   * Check if a fixture is live
   * @param {string} beventId - Event ID to check
   * @returns {boolean} - True if fixture is live
   */
  async isFixtureLive(beventId) {
    try {
      const key = `live:bevent:${beventId}`;
      const exists = await this.redis.exists(key);
      return Boolean(exists);
    } catch (error) {
      logger.error(`❌ Failed to check if fixture is live`, { beventId, error: error.message });
      return false;
    }
  }

  /**
   * Get TTL for a live fixture
   * @param {string} beventId - Event ID to check
   * @returns {number} - TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  async getFixtureTTL(beventId) {
    try {
      const key = `live:bevent:${beventId}`;
      const ttl = await this.redis.ttl(key);
      return ttl;
    } catch (error) {
      logger.error(`❌ Failed to get fixture TTL`, { beventId, error: error.message });
      return -2;
    }
  }

  /**
   * Health check for Redis service
   * @returns {Object} - Health status
   */
  async healthCheck() {
    try {
      const connectionStatus = this.redis.getConnectionStatus();
      const liveCount = await this.getLiveFixturesCount();
      const ping = await this.redis.ping();
      
      return {
        status: 'healthy',
        connection: connectionStatus,
        liveFixtures: liveCount,
        ping: ping === 'PONG',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = RedisService;

