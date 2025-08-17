const db = require('../utils/database');
const logger = require('../utils/logger');

/**
 * Database Service for Sports Fixtures
 * Manages upcoming and completed matches in PostgreSQL for persistence
 */
class DbService {
  constructor() {
    this.tableName = 'matches';
  }

  /**
   * Upsert fixtures (create or update)
   * @param {Array} fixtures - Array of fixture objects
   * @returns {number} - Number of fixtures processed
   */
  async upsertFixtures(fixtures) {
    try {
      let processedCount = 0;
      
      for (const fixture of fixtures) {
        try {
          await this.upsertFixture(fixture);
          processedCount++;
        } catch (error) {
          logger.warn(`⚠️ Failed to upsert fixture`, { 
            beventId: fixture.beventId, 
            bmarketId: fixture.bmarketId, 
            error: error.message 
          });
        }
      }
      
      logger.info(`✅ Upserted ${processedCount}/${fixtures.length} fixtures in database`);
      return processedCount;
      
    } catch (error) {
      logger.error(`❌ Failed to upsert fixtures`, { error: error.message });
      throw error;
    }
  }

  /**
   * Upsert single fixture
   * @param {Object} fixture - Fixture object
   * @returns {Object} - Upserted fixture result
   */
  async upsertFixture(fixture) {
    try {
      // Check if fixture already exists
      const existingFixture = await this.findFixtureByExternalIds(fixture);
      
      if (existingFixture) {
        // Update existing fixture
        return await this.updateFixture(existingFixture.id, fixture);
      } else {
        // Create new fixture
        return await this.createFixture(fixture);
      }
    } catch (error) {
      logger.error(`❌ Failed to upsert fixture`, { 
        beventId: fixture.beventId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Find fixture by external IDs (beventId or bmarketId)
   * @param {Object} fixture - Fixture object with external IDs
   * @returns {Object|null} - Found fixture or null
   */
  async findFixtureByExternalIds(fixture) {
    try {
      if (fixture.beventId) {
        const result = await db.findOne(this.tableName, { beventId: fixture.beventId });
        if (result) return result;
      }
      
      if (fixture.bmarketId) {
        const result = await db.findOne(this.tableName, { bmarketId: fixture.bmarketId });
        if (result) return result;
      }
      
      return null;
    } catch (error) {
      logger.error(`❌ Failed to find fixture by external IDs`, { 
        beventId: fixture.beventId, 
        bmarketId: fixture.bmarketId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Create new fixture in database
   * @param {Object} fixture - Fixture object
   * @returns {Object} - Created fixture result
   */
  async createFixture(fixture) {
    try {
      const fixtureData = {
        title: fixture.name || fixture.ename || 'Cricket Match',
        externalId: fixture.bmarketId || fixture.beventId || 'unknown',
        status: this.mapStatus(fixture.status || fixture.iplay),
        bmarketId: fixture.bmarketId || null,
        beventId: fixture.beventId || null,
        matchName: fixture.name || fixture.ename || null,
        tournament: fixture.tournament || fixture.cname || null,
        startTime: fixture.startTime || fixture.stime ? new Date(fixture.startTime || fixture.stime) : null,
        isLive: Boolean(fixture.inPlay || fixture.iplay),
        matchType: fixture.matchType || fixture.gtype || 'match',
        isCricket: fixture.isCricket !== false && fixture.iscc !== false,
        teams: fixture.teams || fixture.brunners || null,
        lastUpdated: new Date(),
        apiSource: 'marketsarket.qnsports.live',
        rawData: fixture.rawData || fixture,
        isActive: true,
        isDeleted: false
      };

      const result = await db.insert(this.tableName, fixtureData);
      
      logger.info(`✅ Created fixture in database`, { 
        id: result.id, 
        beventId: fixtureData.beventId,
        matchName: fixtureData.matchName 
      });
      
      return result;
    } catch (error) {
      logger.error(`❌ Failed to create fixture`, { 
        beventId: fixture.beventId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update existing fixture in database
   * @param {string} fixtureId - Database fixture ID
   * @param {Object} fixture - Updated fixture data
   * @returns {Object} - Updated fixture result
   */
  async updateFixture(fixtureId, fixture) {
    try {
      const updateData = {
        title: fixture.name || fixture.ename || 'Cricket Match',
        status: this.mapStatus(fixture.status || fixture.iplay),
        bmarketId: fixture.bmarketId || null,
        beventId: fixture.beventId || null,
        matchName: fixture.name || fixture.ename || null,
        tournament: fixture.tournament || fixture.cname || null,
        startTime: fixture.startTime || fixture.stime ? new Date(fixture.startTime || fixture.stime) : null,
        isLive: Boolean(fixture.inPlay || fixture.iplay),
        matchType: fixture.matchType || fixture.gtype || 'match',
        isCricket: fixture.isCricket !== false && fixture.iscc !== false,
        teams: fixture.teams || fixture.brunners || null,
        lastUpdated: new Date(),
        rawData: fixture.rawData || fixture
      };

      const result = await db.update(this.tableName, fixtureId, updateData);
      
      logger.info(`✅ Updated fixture in database`, { 
        id: fixtureId, 
        beventId: updateData.beventId 
      });
      
      return result;
    } catch (error) {
      logger.error(`❌ Failed to update fixture`, { 
        fixtureId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update completed fixtures status
   * @param {Array} completedFixtures - Array of completed fixture objects
   * @returns {number} - Number of fixtures updated
   */
  async updateCompletedFixtures(completedFixtures) {
    try {
      let updatedCount = 0;
      
      for (const fixture of completedFixtures) {
        try {
          const existingFixture = await this.findFixtureByExternalIds(fixture);
          
          if (existingFixture) {
            // Update status to completed
            const updateData = {
              status: 'COMPLETED',
              isLive: false,
              lastUpdated: new Date(),
              rawData: fixture.rawData || fixture
            };
            
            await db.update(this.tableName, existingFixture.id, updateData);
            updatedCount++;
            
            logger.debug(`✅ Updated fixture to completed`, { 
              id: existingFixture.id, 
              beventId: fixture.beventId 
            });
          }
        } catch (error) {
          logger.warn(`⚠️ Failed to update completed fixture`, { 
            beventId: fixture.beventId, 
            error: error.message 
          });
        }
      }
      
      logger.info(`✅ Updated ${updatedCount}/${completedFixtures.length} completed fixtures`);
      return updatedCount;
      
    } catch (error) {
      logger.error(`❌ Failed to update completed fixtures`, { error: error.message });
      throw error;
    }
  }

  /**
   * Get all upcoming fixtures from database
   * @returns {Array} - Array of upcoming fixtures
   */
  async getUpcomingFixtures() {
    try {
      const fixtures = await db.findMany(this.tableName, {
        status: 'UPCOMING',
        isActive: true,
        isDeleted: false
      });
      
      logger.debug(`✅ Retrieved ${fixtures.length} upcoming fixtures from database`);
      return fixtures;
      
    } catch (error) {
      logger.error(`❌ Failed to get upcoming fixtures`, { error: error.message });
      return [];
    }
  }

  /**
   * Get all completed fixtures from database
   * @param {number} limit - Maximum number of fixtures to return
   * @returns {Array} - Array of completed fixtures
   */
  async getCompletedFixtures(limit = 100) {
    try {
      const fixtures = await db.findMany(this.tableName, {
        status: 'COMPLETED',
        isActive: true,
        isDeleted: false
      }, { limit, orderBy: { lastUpdated: 'DESC' } });
      
      logger.debug(`✅ Retrieved ${fixtures.length} completed fixtures from database`);
      return fixtures;
      
    } catch (error) {
      logger.error(`❌ Failed to get completed fixtures`, { error: error.message });
      return [];
    }
  }

  /**
   * Get fixtures by status
   * @param {string} status - Fixture status to filter by
   * @param {number} limit - Maximum number of fixtures to return
   * @returns {Array} - Array of fixtures with specified status
   */
  async getFixturesByStatus(status, limit = 100) {
    try {
      const fixtures = await db.findMany(this.tableName, {
        status: status.toUpperCase(),
        isActive: true,
        isDeleted: false
      }, { limit, orderBy: { lastUpdated: 'DESC' } });
      
      logger.debug(`✅ Retrieved ${fixtures.length} ${status} fixtures from database`);
      return fixtures;
      
    } catch (error) {
      logger.error(`❌ Failed to get fixtures by status`, { status, error: error.message });
      return [];
    }
  }

  /**
   * Get fixture by beventId
   * @param {string} beventId - Event ID to search for
   * @returns {Object|null} - Fixture data or null if not found
   */
  async getFixtureByBeventId(beventId) {
    try {
      const fixture = await db.findOne(this.tableName, { beventId, isActive: true, isDeleted: false });
      
      if (fixture) {
        logger.debug(`✅ Retrieved fixture by beventId from database`, { beventId });
        return fixture;
      }
      
      return null;
    } catch (error) {
      logger.error(`❌ Failed to get fixture by beventId`, { beventId, error: error.message });
      return null;
    }
  }

  /**
   * Get fixture by bmarketId
   * @param {string} bmarketId - Market ID to search for
   * @returns {Object|null} - Fixture data or null if not found
   */
  async getFixtureByBmarketId(bmarketId) {
    try {
      const fixture = await db.findOne(this.tableName, { bmarketId, isActive: true, isDeleted: false });
      
      if (fixture) {
        logger.debug(`✅ Retrieved fixture by bmarketId from database`, { bmarketId });
        return fixture;
      }
      
      return null;
    } catch (error) {
      logger.error(`❌ Failed to get fixture by bmarketId`, { bmarketId, error: error.message });
      return null;
    }
  }

  /**
   * Get fixtures count by status
   * @returns {Object} - Count of fixtures by status
   */
  async getFixturesCount() {
    try {
      const counts = {};
      const statuses = ['UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED', 'SUSPENDED', 'CLOSED'];
      
      for (const status of statuses) {
        const count = await db.count(this.tableName, { 
          status, 
          isActive: true, 
          isDeleted: false 
        });
        counts[status] = count;
      }
      
      logger.debug(`✅ Retrieved fixtures count from database`, counts);
      return counts;
      
    } catch (error) {
      logger.error(`❌ Failed to get fixtures count`, { error: error.message });
      return {};
    }
  }

  /**
   * Clean up old completed fixtures
   * @param {number} daysOld - Remove fixtures older than this many days
   * @returns {number} - Number of fixtures cleaned up
   */
  async cleanupOldCompletedFixtures(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const oldFixtures = await db.findMany(this.tableName, {
        status: 'COMPLETED',
        lastUpdated: { $lt: cutoffDate },
        isActive: true,
        isDeleted: false
      });
      
      let cleanedCount = 0;
      for (const fixture of oldFixtures) {
        try {
          await db.update(this.tableName, fixture.id, { 
            isActive: false, 
            isDeleted: true,
            deletedAt: new Date()
          });
          cleanedCount++;
        } catch (error) {
          logger.warn(`⚠️ Failed to cleanup fixture`, { id: fixture.id, error: error.message });
        }
      }
      
      if (cleanedCount > 0) {
        logger.info(`🧹 Cleaned up ${cleanedCount} old completed fixtures (older than ${daysOld} days)`);
      }
      
      return cleanedCount;
      
    } catch (error) {
      logger.error(`❌ Failed to cleanup old completed fixtures`, { error: error.message });
      return 0;
    }
  }

  /**
   * Map API status to database status enum
   * @param {any} apiStatus - Status from API
   * @returns {string} - Mapped database status
   */
  mapStatus(apiStatus) {
    if (!apiStatus) return 'UPCOMING';
    
    const status = String(apiStatus).toLowerCase();
    
    if (status === 'open' || status === 'scheduled') return 'UPCOMING';
    if (status === 'live' || status === 'inplay' || status === 'in_play') return 'LIVE';
    if (status === 'completed' || status === 'finished' || status === 'resulted') return 'COMPLETED';
    if (status === 'abandoned' || status === 'canceled' || status === 'cancelled') return 'ABANDONED';
    if (status === 'suspended') return 'SUSPENDED';
    if (status === 'closed') return 'CLOSED';
    
    return 'UPCOMING'; // Default fallback
  }

  /**
   * Health check for database service
   * @returns {Object} - Health status
   */
  async healthCheck() {
    try {
      const count = await db.count(this.tableName, { isActive: true, isDeleted: false });
      const statusCounts = await this.getFixturesCount();
      
      return {
        status: 'healthy',
        totalFixtures: count,
        statusCounts,
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

module.exports = DbService;
