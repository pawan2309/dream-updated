const { Job } = require('bullmq');
const axios = require('axios');
const RedisService = require('../services/redisService');
const DbService = require('../services/dbService');
const logger = require('../utils/logger');

/**
 * BullMQ Job Processor for Sports Fixtures
 * Handles: fetchLiveFixtures, fetchUpcomingFixtures, updateCompletedFixtures
 */
class FixturesJobProcessor {
  constructor() {
    this.redisService = new RedisService();
    this.dbService = new DbService();
    this.upstreamUrl = 'https://marketsarket.qnsports.live/cricketmatches';
  }

  /**
   * Main job processor - routes jobs to appropriate handlers
   */
  async process(job) {
    const { type, data } = job.data;
    
    try {
      logger.info(`🔄 Processing ${type} job`, { jobId: job.id, data });
      
      switch (type) {
        case 'fetchLiveFixtures':
          return await this.fetchLiveFixtures(job);
        case 'fetchUpcomingFixtures':
          return await this.fetchUpcomingFixtures(job);
        case 'updateCompletedFixtures':
          return await this.updateCompletedFixtures(job);
        default:
          throw new Error(`Unknown job type: ${type}`);
      }
    } catch (error) {
      logger.error(`❌ Job ${type} failed`, { jobId: job.id, error: error.message });
      throw error; // Re-throw for BullMQ retry handling
    }
  }

  /**
   * Fetch and store live (in-play) matches in Redis with TTL
   * TTL: 5 minutes for live matches
   */
  async fetchLiveFixtures(job) {
    try {
      logger.info('🏏 Fetching live fixtures from upstream API...');
      
      // Fetch from upstream API
      const { data: rawData } = await axios.get(this.upstreamUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Betting-Fixtures-System/1.0',
          'Accept': 'application/json'
        }
      });

      // Extract and filter live fixtures
      const liveFixtures = this.extractLiveFixtures(rawData);
      logger.info(`📊 Found ${liveFixtures.length} live fixtures`);

      if (liveFixtures.length === 0) {
        logger.info('ℹ️ No live fixtures found');
        return { success: true, count: 0, message: 'No live fixtures' };
      }

      // Store each live fixture in Redis with 5-minute TTL
      const storedCount = await this.storeLiveFixturesInRedis(liveFixtures);
      
      logger.info(`✅ Stored ${storedCount} live fixtures in Redis with 5-minute TTL`);
      
      return {
        success: true,
        count: storedCount,
        message: `Stored ${storedCount} live fixtures in Redis`,
        ttl: 300 // 5 minutes in seconds
      };
      
    } catch (error) {
      logger.error('❌ fetchLiveFixtures failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch and store upcoming matches in PostgreSQL
   * These are persistent and don't expire
   */
  async fetchUpcomingFixtures(job) {
    try {
      logger.info('🏏 Fetching upcoming fixtures from upstream API...');
      
      // Fetch from upstream API
      const { data: rawData } = await axios.get(this.upstreamUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Betting-Fixtures-System/1.0',
          'Accept': 'application/json'
        }
      });

      // Extract and filter upcoming fixtures
      const upcomingFixtures = this.extractUpcomingFixtures(rawData);
      logger.info(`📊 Found ${upcomingFixtures.length} upcoming fixtures`);

      if (upcomingFixtures.length === 0) {
        logger.info('ℹ️ No upcoming fixtures found');
        return { success: true, count: 0, message: 'No upcoming fixtures' };
      }

      // Store upcoming fixtures in PostgreSQL
      const storedCount = await this.dbService.upsertFixtures(upcomingFixtures);
      
      logger.info(`✅ Stored ${storedCount} upcoming fixtures in PostgreSQL`);
      
      return {
        success: true,
        count: storedCount,
        message: `Stored ${storedCount} upcoming fixtures in PostgreSQL`
      };
      
    } catch (error) {
      logger.error('❌ fetchUpcomingFixtures failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Update completed matches status in PostgreSQL
   * Marks matches as completed and updates final scores/results
   */
  async updateCompletedFixtures(job) {
    try {
      logger.info('🏏 Updating completed fixtures...');
      
      // Get fixtures that might be completed from upstream
      const { data: rawData } = await axios.get(this.upstreamUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Betting-Fixtures-System/1.0',
          'Accept': 'application/json'
        }
      });

      // Extract completed fixtures
      const completedFixtures = this.extractCompletedFixtures(rawData);
      logger.info(`📊 Found ${completedFixtures.length} completed fixtures`);

      if (completedFixtures.length === 0) {
        logger.info('ℹ️ No completed fixtures found');
        return { success: true, count: 0, message: 'No completed fixtures' };
      }

      // Update completed fixtures in PostgreSQL
      const updatedCount = await this.dbService.updateCompletedFixtures(completedFixtures);
      
      logger.info(`✅ Updated ${updatedCount} completed fixtures in PostgreSQL`);
      
      return {
        success: true,
        count: updatedCount,
        message: `Updated ${updatedCount} completed fixtures in PostgreSQL`
      };
      
    } catch (error) {
      logger.error('❌ updateCompletedFixtures failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract live fixtures from upstream API response
   * Filters for matches that are currently in-play
   */
  extractLiveFixtures(rawData) {
    let fixtures = [];
    
    // Handle different response structures
    if (Array.isArray(rawData)) {
      fixtures = rawData;
    } else if (rawData && typeof rawData === 'object') {
      if (rawData.t1 && Array.isArray(rawData.t1)) fixtures = rawData.t1;
      if (fixtures.length === 0 && rawData.t2 && Array.isArray(rawData.t2)) fixtures = rawData.t2;
    }

    // Filter for live fixtures only
    return fixtures.filter(fixture => {
      const isLive = fixture.inPlay || fixture.iplay || fixture.status === 'live';
      return isLive && (fixture.beventId || fixture.eventId);
    }).map(fixture => this.normalizeFixture(fixture));
  }

  /**
   * Extract upcoming fixtures from upstream API response
   * Filters for matches that are scheduled but not yet started
   */
  extractUpcomingFixtures(rawData) {
    let fixtures = [];
    
    // Handle different response structures
    if (Array.isArray(rawData)) {
      fixtures = rawData;
    } else if (rawData && typeof rawData === 'object') {
      if (rawData.t1 && Array.isArray(rawData.t1)) fixtures = rawData.t1;
      if (fixtures.length === 0 && rawData.t2 && Array.isArray(rawData.t2)) fixtures = rawData.t2;
    }

    // Filter for upcoming fixtures only
    return fixtures.filter(fixture => {
      const isUpcoming = !fixture.inPlay && !fixture.iplay && 
                         fixture.status !== 'live' && 
                         fixture.status !== 'completed';
      return isUpcoming && (fixture.beventId || fixture.eventId);
    }).map(fixture => this.normalizeFixture(fixture));
  }

  /**
   * Extract completed fixtures from upstream API response
   * Filters for matches that have finished
   */
  extractCompletedFixtures(rawData) {
    let fixtures = [];
    
    // Handle different response structures
    if (Array.isArray(rawData)) {
      fixtures = rawData;
    } else if (rawData && typeof rawData === 'object') {
      if (rawData.t1 && Array.isArray(rawData.t1)) fixtures = rawData.t1;
      if (fixtures.length === 0 && rawData.t2 && Array.isArray(rawData.t2)) fixtures = rawData.t2;
    }

    // Filter for completed fixtures only
    return fixtures.filter(fixture => {
      const isCompleted = fixture.status === 'completed' || 
                         fixture.status === 'finished' || 
                         fixture.status === 'resulted';
      return isCompleted && (fixture.beventId || fixture.eventId);
    }).map(fixture => this.normalizeFixture(fixture));
  }

  /**
   * Normalize fixture data structure
   * Ensures consistent format across all fixture types
   */
  normalizeFixture(fixture) {
    const beventId = fixture.beventId || fixture.eventId || null;
    const bmarketId = fixture.bmarketId || fixture.marketId || null;
    
    return {
      ...fixture,
      beventId: beventId ? String(beventId) : null,
      bmarketId: bmarketId ? String(bmarketId) : null,
      isLive: Boolean(fixture.inPlay || fixture.iplay),
      status: this.mapStatus(fixture.status || fixture.iplay),
      lastUpdated: new Date().toISOString(),
      apiSource: 'marketsarket.qnsports.live'
    };
  }

  /**
   * Store live fixtures in Redis with 5-minute TTL
   * Uses both beventId and bmarketId as keys for fast lookup
   */
  async storeLiveFixturesInRedis(fixtures) {
    let storedCount = 0;
    
    for (const fixture of fixtures) {
      try {
        // Store by beventId
        if (fixture.beventId) {
          await this.redisService.setFixture(`live:bevent:${fixture.beventId}`, fixture, 300);
          storedCount++;
        }
        
        // Store by bmarketId
        if (fixture.bmarketId) {
          await this.redisService.setFixture(`live:bmarket:${fixture.bmarketId}`, fixture, 300);
          storedCount++;
        }
        
        // Store in live fixtures list
        await this.redisService.addToLiveFixturesList(fixture, 300);
        
      } catch (error) {
        logger.warn(`⚠️ Failed to store fixture in Redis`, { 
          beventId: fixture.beventId, 
          bmarketId: fixture.bmarketId, 
          error: error.message 
        });
      }
    }
    
    return storedCount;
  }

  /**
   * Map API status to internal status enum
   */
  mapStatus(apiStatus) {
    if (!apiStatus) return 'UPCOMING';
    
    const status = String(apiStatus).toLowerCase();
    
    if (status === 'live' || status === 'inplay' || status === 'in_play') return 'LIVE';
    if (status === 'completed' || status === 'finished' || status === 'resulted') return 'COMPLETED';
    if (status === 'abandoned' || status === 'canceled' || status === 'cancelled') return 'ABANDONED';
    if (status === 'suspended') return 'SUSPENDED';
    if (status === 'closed') return 'CLOSED';
    
    return 'UPCOMING'; // Default fallback
  }
}

module.exports = FixturesJobProcessor;
