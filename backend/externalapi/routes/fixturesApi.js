const express = require('express');
const router = express.Router();
const RedisService = require('../services/redisService');
const DbService = require('../services/dbService');
const logger = require('../utils/logger');

/**
 * Smart Merging API for Sports Fixtures
 * Combines Redis (live) + Database (upcoming/completed) data
 * Priority: Live (Redis) > Upcoming (DB) > Completed (DB)
 */

// Initialize services
const redisService = new RedisService();
const dbService = new DbService();

/**
 * GET /api/fixtures/dashboard
 * Smart merging endpoint that combines Redis and Database data
 * Returns unified fixtures list with proper priority ordering
 */
router.get('/dashboard', async (req, res) => {
  try {
    const startTime = Date.now();
    logger.info('🏏 Dashboard API: Starting smart merge of fixtures data...');
    
    // Get query parameters for filtering
    const { 
      status, 
      live, 
      upcoming, 
      completed, 
      limit = 100,
      includeCompleted = 'true'
    } = req.query;
    
    // Parse boolean parameters
    const includeCompletedBool = includeCompleted === 'true';
    const limitNum = parseInt(limit, 10);
    
    logger.debug('🏏 Dashboard API: Query parameters', { 
      status, live, upcoming, completed, limit: limitNum, includeCompleted: includeCompletedBool 
    });

    // Step 1: Get live fixtures from Redis (highest priority)
    logger.debug('🏏 Dashboard API: Fetching live fixtures from Redis...');
    const liveFixtures = await redisService.getAllLiveFixtures();
    logger.info(`🏏 Dashboard API: Retrieved ${liveFixtures.length} live fixtures from Redis`);

    // Step 2: Get upcoming fixtures from Database
    logger.debug('🏏 Dashboard API: Fetching upcoming fixtures from database...');
    const upcomingFixtures = await dbService.getUpcomingFixtures();
    logger.info(`🏏 Dashboard API: Retrieved ${upcomingFixtures.length} upcoming fixtures from database`);

    // Step 3: Get completed fixtures from Database (if requested)
    let completedFixtures = [];
    if (includeCompletedBool) {
      logger.debug('🏏 Dashboard API: Fetching completed fixtures from database...');
      completedFixtures = await dbService.getCompletedFixtures(limitNum);
      logger.info(`🏏 Dashboard API: Retrieved ${completedFixtures.length} completed fixtures from database`);
    }

    // Step 4: Smart merge with duplicate avoidance
    logger.debug('🏏 Dashboard API: Starting smart merge process...');
    const mergedFixtures = await smartMergeFixtures(
      liveFixtures, 
      upcomingFixtures, 
      completedFixtures,
      { status, live, upcoming, completed, limit: limitNum }
    );

    // Step 5: Transform fixture IDs for frontend display
    const transformedFixtures = mergedFixtures.map(fixture => transformFixtureForFrontend(fixture));

    const processingTime = Date.now() - startTime;
    
    logger.info(`🏏 Dashboard API: Successfully merged ${transformedFixtures.length} fixtures`, {
      live: liveFixtures.length,
      upcoming: upcomingFixtures.length,
      completed: completedFixtures.length,
      merged: transformedFixtures.length,
      processingTime: `${processingTime}ms`
    });

    // Return unified response
    res.status(200).json({
      success: true,
      message: 'Fixtures data successfully merged',
      data: {
        fixtures: transformedFixtures,
        counts: {
          total: transformedFixtures.length,
          live: liveFixtures.length,
          upcoming: upcomingFixtures.length,
          completed: completedFixtures.length
        },
        sources: {
          live: 'Redis (TTL: 5 minutes)',
          upcoming: 'PostgreSQL (persistent)',
          completed: 'PostgreSQL (persistent)'
        },
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ Dashboard API: Failed to merge fixtures data', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve fixtures data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/fixtures/live
 * Get only live fixtures from Redis
 */
router.get('/live', async (req, res) => {
  try {
    logger.info('🏏 Live Fixtures API: Fetching live fixtures from Redis...');
    
    const liveFixtures = await redisService.getAllLiveFixtures();
    const transformedFixtures = liveFixtures.map(fixture => transformFixtureForFrontend(fixture));
    
    logger.info(`🏏 Live Fixtures API: Retrieved ${transformedFixtures.length} live fixtures`);
    
    res.status(200).json({
      success: true,
      message: 'Live fixtures retrieved successfully',
      data: {
        fixtures: transformedFixtures,
        count: transformedFixtures.length,
        source: 'Redis (TTL: 5 minutes)',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ Live Fixtures API: Failed to retrieve live fixtures', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve live fixtures',
      message: error.message
    });
  }
});

/**
 * GET /api/fixtures/upcoming
 * Get only upcoming fixtures from database
 */
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const limitNum = parseInt(limit, 10);
    
    logger.info(`🏏 Upcoming Fixtures API: Fetching up to ${limitNum} upcoming fixtures from database...`);
    
    const upcomingFixtures = await dbService.getUpcomingFixtures();
    const limitedFixtures = upcomingFixtures.slice(0, limitNum);
    const transformedFixtures = limitedFixtures.map(fixture => transformFixtureForFrontend(fixture));
    
    logger.info(`🏏 Upcoming Fixtures API: Retrieved ${transformedFixtures.length} upcoming fixtures`);
    
    res.status(200).json({
      success: true,
      message: 'Upcoming fixtures retrieved successfully',
      data: {
        fixtures: transformedFixtures,
        count: transformedFixtures.length,
        source: 'PostgreSQL (persistent)',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ Upcoming Fixtures API: Failed to retrieve upcoming fixtures', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve upcoming fixtures',
      message: error.message
    });
  }
});

/**
 * GET /api/fixtures/completed
 * Get only completed fixtures from database
 */
router.get('/completed', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const limitNum = parseInt(limit, 10);
    
    logger.info(`🏏 Completed Fixtures API: Fetching up to ${limitNum} completed fixtures from database...`);
    
    const completedFixtures = await dbService.getCompletedFixtures(limitNum);
    const transformedFixtures = completedFixtures.map(fixture => transformFixtureForFrontend(fixture));
    
    logger.info(`🏏 Completed Fixtures API: Retrieved ${transformedFixtures.length} completed fixtures`);
    
    res.status(200).json({
      success: true,
      message: 'Completed fixtures retrieved successfully',
      data: {
        fixtures: transformedFixtures,
        count: transformedFixtures.length,
        source: 'PostgreSQL (persistent)',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ Completed Fixtures API: Failed to retrieve completed fixtures', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve completed fixtures',
      message: error.message
    });
  }
});

/**
 * GET /api/fixtures/health
 * Health check for fixtures system
 */
router.get('/health', async (req, res) => {
  try {
    logger.info('🏏 Health Check API: Checking fixtures system health...');
    
    // Check Redis health
    const redisHealth = await redisService.healthCheck();
    
    // Check Database health
    const dbHealth = await dbService.healthCheck();
    
    const overallHealth = {
      status: redisHealth.status === 'healthy' && dbHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisHealth,
        database: dbHealth
      }
    };
    
    logger.info('🏏 Health Check API: Health check completed', { status: overallHealth.status });
    
    res.status(200).json({
      success: true,
      message: 'Fixtures system health check completed',
      data: overallHealth
    });

  } catch (error) {
    logger.error('❌ Health Check API: Failed to check system health', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to check system health',
      message: error.message
    });
  }
});

/**
 * Smart merge fixtures from multiple sources
 * Priority: Live (Redis) > Upcoming (DB) > Completed (DB)
 * Avoids duplicates based on beventId
 */
async function smartMergeFixtures(liveFixtures, upcomingFixtures, completedFixtures, filters) {
  try {
    logger.debug('🏏 Smart Merge: Starting merge process...');
    
    // Create a Map to track processed fixtures by beventId (avoid duplicates)
    const processedFixtures = new Map();
    const mergedFixtures = [];
    
    // Helper function to add fixture if not already processed
    const addFixtureIfNew = (fixture, source) => {
      const key = fixture.beventId || fixture.bmarketId;
      if (!key) {
        logger.warn(`⚠️ Smart Merge: Fixture missing both beventId and bmarketId, skipping`, { source });
        return false;
      }
      
      if (!processedFixtures.has(key)) {
        // Add source tracking
        const enhancedFixture = {
          ...fixture,
          _source: source,
          _mergedAt: new Date().toISOString()
        };
        
        processedFixtures.set(key, enhancedFixture);
        mergedFixtures.push(enhancedFixture);
        return true;
      } else {
        logger.debug(`🏏 Smart Merge: Duplicate fixture skipped`, { key, source, existingSource: processedFixtures.get(key)._source });
        return false;
      }
    };
    
    // Step 1: Add live fixtures first (highest priority)
    logger.debug(`🏏 Smart Merge: Processing ${liveFixtures.length} live fixtures...`);
    for (const fixture of liveFixtures) {
      addFixtureIfNew(fixture, 'redis');
    }
    
    // Step 2: Add upcoming fixtures (second priority)
    logger.debug(`🏏 Smart Merge: Processing ${upcomingFixtures.length} upcoming fixtures...`);
    for (const fixture of upcomingFixtures) {
      addFixtureIfNew(fixture, 'database');
    }
    
    // Step 3: Add completed fixtures (lowest priority)
    logger.debug(`🏏 Smart Merge: Processing ${completedFixtures.length} completed fixtures...`);
    for (const fixture of completedFixtures) {
      addFixtureIfNew(fixture, 'database');
    }
    
    // Step 4: Apply filters if specified
    let filteredFixtures = mergedFixtures;
    
    if (filters.status) {
      const statusUpper = filters.status.toUpperCase();
      filteredFixtures = filteredFixtures.filter(f => f.status === statusUpper);
      logger.debug(`🏏 Smart Merge: Filtered by status '${statusUpper}', ${filteredFixtures.length} fixtures remaining`);
    }
    
    if (filters.live === 'true') {
      filteredFixtures = filteredFixtures.filter(f => f.isLive === true);
      logger.debug(`🏏 Smart Merge: Filtered for live only, ${filteredFixtures.length} fixtures remaining`);
    }
    
    if (filters.upcoming === 'true') {
      filteredFixtures = filteredFixtures.filter(f => f.status === 'UPCOMING');
      logger.debug(`🏏 Smart Merge: Filtered for upcoming only, ${filteredFixtures.length} fixtures remaining`);
    }
    
    if (filters.completed === 'true') {
      filteredFixtures = filteredFixtures.filter(f => f.status === 'COMPLETED');
      logger.debug(`🏏 Smart Merge: Filtered for completed only, ${filteredFixtures.length} fixtures remaining`);
    }
    
    // Step 5: Apply limit
    if (filters.limit && filteredFixtures.length > filters.limit) {
      filteredFixtures = filteredFixtures.slice(0, filters.limit);
      logger.debug(`🏏 Smart Merge: Applied limit ${filters.limit}, ${filteredFixtures.length} fixtures remaining`);
    }
    
    // Step 6: Sort by priority and timestamp
    filteredFixtures.sort((a, b) => {
      // Priority order: Live > Upcoming > Completed
      const priorityOrder = { 'LIVE': 3, 'UPCOMING': 2, 'COMPLETED': 1 };
      const priorityDiff = (priorityOrder[b.status] || 0) - (priorityOrder[a.status] || 0);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Within same priority, sort by lastUpdated (newest first)
      const aTime = new Date(a.lastUpdated || 0);
      const bTime = new Date(b.lastUpdated || 0);
      return bTime - aTime;
    });
    
    logger.info(`🏏 Smart Merge: Successfully merged ${mergedFixtures.length} fixtures, filtered to ${filteredFixtures.length}`);
    
    return filteredFixtures;
    
  } catch (error) {
    logger.error('❌ Smart Merge: Failed to merge fixtures', { error: error.message });
    throw error;
  }
}

/**
 * Transform fixture for frontend display
 * Ensures consistent format and ID transformation
 */
function transformFixtureForFrontend(fixture) {
  try {
    const beventId = fixture.beventId || fixture.eventId;
    const bmarketId = fixture.bmarketId || fixture.marketId;
    
    // Transform ID field for frontend display
    let displayId;
    if (beventId) {
      displayId = bmarketId ? `${beventId}(${bmarketId})` : String(beventId);
    } else {
      displayId = fixture.id || fixture.externalId || 'unknown';
    }
    
    return {
      ...fixture,
      id: displayId,
      displayId: displayId,
      // Ensure these fields are always present
      beventId: beventId || null,
      bmarketId: bmarketId || null,
      // Add source information
      source: fixture._source || 'unknown',
      mergedAt: fixture._mergedAt || new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('❌ Transform Fixture: Failed to transform fixture for frontend', { 
      fixtureId: fixture.id, 
      error: error.message 
    });
    
    // Return minimal safe fixture data
    return {
      id: fixture.id || 'unknown',
      displayId: 'Error: Invalid fixture data',
      beventId: null,
      bmarketId: null,
      status: 'ERROR',
      source: 'error',
      mergedAt: new Date().toISOString()
    };
  }
}

module.exports = router;
