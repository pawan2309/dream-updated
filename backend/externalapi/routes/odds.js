const express = require('express');
const router = express.Router();
const redis = require('../utils/redisClient');
const logger = require('../utils/logger');
const config = require('../../config');
const autoMatchSync = require('../services/autoMatchSync');

/**
 * GET /api/odds/test - Simple test endpoint to verify the route is working
 */
router.get('/test', (req, res) => {
  logger.info(`🧪 [ODDS] Test endpoint called`);
  res.json({
    success: true,
    message: 'Odds route is working',
    timestamp: new Date().toISOString(),
    route: '/api/odds/test'
  });
});

/**
 * GET /api/odds/:matchId
 * Fetch odds for a specific match
 */
router.get('/:matchId', async (req, res) => {
  const startTime = Date.now();
  try {
    const { matchId } = req.params;
    logger.info(`🎯 [ODDS] Starting odds fetch for match: ${matchId}`);
    logger.info(`🎯 [ODDS] Request headers: ${JSON.stringify(req.headers)}`);
    logger.info(`🎯 [ODDS] Request IP: ${req.ip}`);

    // Clean the matchId (remove parentheses if present)
    const cleanMatchId = matchId.split('(')[0];
    const bmarketId = matchId.includes('(') ? matchId.match(/\(([^)]+)\)/)?.[1] : null;
    logger.info(`🎯 [ODDS] Cleaned matchId: ${cleanMatchId}, bmarketId: ${bmarketId}`);

    // Try to get odds from Redis cache first
    try {
      logger.info(`🎯 [ODDS] Checking Redis cache for key: odds:match:${cleanMatchId}`);
      const cachedOdds = await redis.get(`odds:match:${cleanMatchId}`);
      if (cachedOdds) {
        logger.info(`✅ [ODDS] Cache HIT - Returning cached odds for match: ${cleanMatchId}`);
        logger.info(`✅ [ODDS] Cached data size: ${cachedOdds.length} characters`);
        const parsedData = JSON.parse(cachedOdds);
        logger.info(`✅ [ODDS] Parsed cached data successfully, markets count: ${parsedData.markets?.length || 0}`);
        return res.json(parsedData);
      } else {
        logger.info(`📋 [ODDS] Cache MISS - No cached odds found for match: ${cleanMatchId}`);
      }
    } catch (redisError) {
      logger.warn(`⚠️ [ODDS] Redis cache error: ${redisError.message}`);
    }

    // Fetch odds from the external API
    const oddsUrl = `https://data.shamexch.xyz/getbm?eventId=${cleanMatchId}`;
    logger.info(`🔗 [ODDS] Fetching odds from external API: ${oddsUrl}`);
    logger.info(`🔗 [ODDS] Request headers: ${JSON.stringify({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    })}`);

    const fetchStartTime = Date.now();
    const response = await fetch(oddsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      // Force IPv6 usage to match browser behavior
      family: 6,
      timeout: 10000
    });
    const fetchTime = Date.now() - fetchStartTime;
    
    logger.info(`🔗 [ODDS] External API response received in ${fetchTime}ms`);
    logger.info(`🔗 [ODDS] Response status: ${response.status} ${response.statusText}`);
    logger.info(`🔗 [ODDS] Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ [ODDS] Failed to fetch odds: ${response.status} ${response.statusText}`);
      logger.error(`❌ [ODDS] Error response body: ${errorText}`);
      return res.status(503).json({
        success: false,
        error: 'Failed to fetch odds from external API',
        message: 'Service temporarily unavailable',
        details: {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorText,
          fetchTime: fetchTime
        }
      });
    }

    logger.info(`✅ [ODDS] External API request successful, parsing response...`);
    const externalData = await response.json();
    logger.info(`✅ [ODDS] External API response parsed successfully`);
    logger.info(`✅ [ODDS] External API response structure: ${JSON.stringify({
      success: externalData.success,
      hasData: !!externalData.data,
      dataType: typeof externalData.data,
      isArray: Array.isArray(externalData.data),
      dataLength: Array.isArray(externalData.data) ? externalData.data.length : 'N/A',
      sampleData: externalData.data && Array.isArray(externalData.data) && externalData.data.length > 0 ? {
        firstMarket: externalData.data[0].mname,
        firstMarketSections: externalData.data[0].section?.length || 0
      } : 'No data'
    })}`);
    
    // Log detailed sample of external API data to understand structure
    if (externalData.data && Array.isArray(externalData.data) && externalData.data.length > 0) {
      logger.info(`🔍 [ODDS] Analyzing ${externalData.data.length} markets for gstatus values...`);
      
      externalData.data.forEach((market, marketIndex) => {
        logger.info(`🔍 [ODDS] Market ${marketIndex + 1}: ${market.mname}`, {
          status: market.status,
          sectionCount: market.section?.length || 0
        });
        
        if (market.section && Array.isArray(market.section)) {
          market.section.forEach((section, sectionIndex) => {
            logger.info(`🔍 [ODDS] Market ${marketIndex + 1}, Section ${sectionIndex + 1}: ${section.nat}`, {
              gstatus: section.gstatus,
              status: section.status,
              oddsCount: section.odds?.length || 0
            });
            
            if (section.odds && Array.isArray(section.odds)) {
              section.odds.forEach((odd, oddIndex) => {
                if (oddIndex < 3) { // Log first 3 odds to avoid spam
                  logger.info(`🔍 [ODDS] Market ${marketIndex + 1}, Section ${sectionIndex + 1}, Odd ${oddIndex + 1}:`, {
                    otype: odd.otype,
                    odds: odd.odds,
                    gstatus: odd.gstatus,
                    status: odd.status
                  });
                }
              });
            }
          });
        }
      });
    }

    // Transform external data to match our frontend expectations
    logger.info(`🔄 [ODDS] Starting data transformation...`);
    const transformStartTime = Date.now();
    const transformedOdds = transformExternalOdds(externalData, cleanMatchId);
    const transformTime = Date.now() - transformStartTime;
    logger.info(`🔄 [ODDS] Data transformation completed in ${transformTime}ms`);
    logger.info(`🔄 [ODDS] Transformed odds structure: ${JSON.stringify({
      matchId: transformedOdds.matchId,
      marketsCount: transformedOdds.markets?.length || 0,
      source: transformedOdds.source,
      success: transformedOdds.success
    })}`);

    // Cache the transformed odds in Redis
    try {
      logger.info(`💾 [ODDS] Caching transformed odds in Redis...`);
      const cacheStartTime = Date.now();
      await redis.set(`odds:match:${cleanMatchId}`, JSON.stringify(transformedOdds), 300); // Cache for 5 minutes
      const cacheTime = Date.now() - cacheStartTime;
      logger.info(`💾 [ODDS] Odds cached successfully in ${cacheTime}ms for match: ${cleanMatchId}`);
    } catch (cacheError) {
      logger.warn(`⚠️ [ODDS] Failed to cache odds: ${cacheError.message}`);
    }

    // 🔄 AUTO-SYNC: Queue match for database synchronization
    try {
      await autoMatchSync.queueMatchForSync({
        eventId: cleanMatchId,
        eventName: transformedOdds.eventName,
        name: transformedOdds.eventName,
        status: transformedOdds.status,
        iplay: transformedOdds.iplay,
        inPlay: transformedOdds.inPlay,
        tournament: transformedOdds.tournament,
        cname: transformedOdds.cname,
        startTime: transformedOdds.startTime,
        stime: transformedOdds.stime,
        teams: transformedOdds.teams,
        brunners: transformedOdds.brunners,
        matchType: transformedOdds.matchType,
        gtype: transformedOdds.gtype,
        apiSource: transformedOdds.apiSource,
        bmarketId: transformedOdds.bmarketId,
        raw: transformedOdds.raw
      });
      logger.info(`✅ [ODDS] Queued match ${cleanMatchId} for auto-sync with enhanced metadata`);
    } catch (syncError) {
      logger.warn(`⚠️ [ODDS] Auto-sync failed for match ${cleanMatchId}:`, syncError.message);
      // Don't fail the odds request if sync fails
    }

    const totalTime = Date.now() - startTime;
    logger.info(`✅ [ODDS] Odds fetch completed successfully in ${totalTime}ms`);
    logger.info(`✅ [ODDS] Returning transformed odds with ${transformedOdds.markets?.length || 0} markets`);
    
    res.json(transformedOdds);

  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error(`❌ [ODDS] Error fetching odds after ${totalTime}ms: ${error.message}`);
    logger.error(`❌ [ODDS] Error stack: ${error.stack}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      details: {
        totalTime: totalTime,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * DELETE /api/odds/:matchId/cache - Clear cache for a specific match (for testing)
 */
router.delete('/:matchId/cache', async (req, res) => {
  try {
    const { matchId } = req.params;
    const cleanMatchId = matchId.split('(')[0];
    
    logger.info(`🗑️ [ODDS] Clearing cache for match: ${cleanMatchId}`);
    
    const deleted = await redis.del(`odds:match:${cleanMatchId}`);
    
    if (deleted > 0) {
      logger.info(`✅ [ODDS] Cache cleared successfully for match: ${cleanMatchId}`);
      res.json({
        success: true,
        message: `Cache cleared for match ${cleanMatchId}`,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.info(`📋 [ODDS] No cache found for match: ${cleanMatchId}`);
      res.json({
        success: true,
        message: `No cache found for match ${cleanMatchId}`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error(`❌ [ODDS] Error clearing cache: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

// GET /api/odds/sync/status - Get auto-sync service status
router.get('/sync/status', async (req, res) => {
  try {
    const status = autoMatchSync.getStatus();
    
    // Enhanced status information
    const enhancedStatus = {
      ...status,
      serviceInfo: {
        name: 'Auto-Match Sync Service',
        description: 'Automatically syncs matches from odds API to database',
        features: [
          'Automatic match creation/updates',
          'Real-time ID validation and fixing',
          'Enhanced field population',
          'Automatic cleanup of incorrect IDs',
          'Safe foreign key handling for bets',
          'Automatic bet migration when needed'
        ]
      },
      foreignKeySafety: {
        description: 'Maintains referential integrity with bets table',
        betMigration: 'Automatically migrates bets when fixing match IDs',
        auditTrail: 'Preserves old matches as deleted for audit purposes'
      },
      lastCleanup: status.lastCleanup || 'Not run yet',
      nextCleanup: status.syncCycleCount ? `After ${5 - (status.syncCycleCount % 5)} more sync cycles` : 'Unknown'
    };
    
    res.json({
      success: true,
      data: enhancedStatus
    });
  } catch (error) {
    console.error('❌ [ODDS] Error getting sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
});

// POST /api/odds/sync/match/:eventId - Force sync a specific match
router.post('/sync/match/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { matchData } = req.body;
    
    console.log(`🔄 [ODDS] Force syncing match ${eventId}`);
    
    const result = await autoMatchSync.forceSyncMatch(eventId, matchData || {});
    
    res.json({
      success: true,
      message: `Match ${eventId} synced successfully`,
      data: result
    });
  } catch (error) {
    console.error(`❌ [ODDS] Error force syncing match ${req.params.eventId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync match',
      details: error.message
    });
  }
});

// POST /api/odds/sync/fix-existing - Fix all existing matches with incorrect data
router.post('/sync/fix-existing', async (req, res) => {
  try {
    logger.info('[ODDS] Starting fix for existing matches...');
    
    // This will trigger the automatic cleanup and ID fixing
    await autoMatchSync.performAutomaticIdCleanup();
    
    res.json({
      success: true,
      message: 'Existing matches fix process initiated',
      note: 'Check /api/odds/sync/status for progress'
    });
  } catch (error) {
    logger.error('[ODDS] Error fixing existing matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix existing matches',
      details: error.message
    });
  }
});

// POST /api/odds/sync/fetch-all - Manually trigger bulk match fetch
router.post('/sync/fetch-all', async (req, res) => {
  try {
    logger.info('[ODDS] Manually triggering bulk match fetch...');
    
    const { apiEndpoint } = req.body;
    const fetchResult = await autoMatchSync.fetchAllMatchesFromAPI(apiEndpoint);
    
    res.json({
      success: true,
      message: `Bulk match fetch completed: ${fetchResult} matches queued`,
      data: {
        matchesQueued: fetchResult,
        status: autoMatchSync.getStatus()
      }
    });
  } catch (error) {
    logger.error('[ODDS] Error during bulk match fetch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch matches',
      details: error.message
    });
  }
});

/**
 * Transform external API data to match our frontend expectations
 */
function transformExternalOdds(externalData, matchId) {
  try {
    logger.info(`🔄 [TRANSFORM] Starting transformation for matchId: ${matchId}`);
    logger.info(`🔄 [TRANSFORM] Input data structure: ${JSON.stringify({
      success: externalData.success,
      hasData: !!externalData.data,
      dataType: typeof externalData.data,
      isArray: Array.isArray(externalData.data),
      dataLength: Array.isArray(externalData.data) ? externalData.data.length : 'N/A'
    })}`);

    if (!externalData.success || !externalData.data || !Array.isArray(externalData.data)) {
      logger.error(`❌ [TRANSFORM] Invalid external API response format`);
      logger.error(`❌ [TRANSFORM] success: ${externalData.success}, hasData: ${!!externalData.data}, isArray: ${Array.isArray(externalData.data)}`);
      throw new Error('Invalid external API response format');
    }

    logger.info(`🔄 [TRANSFORM] Valid response format, processing ${externalData.data.length} markets`);
    const markets = [];
    
    // Process each market from external API
    externalData.data.forEach((market, index) => {
      logger.info(`🔄 [TRANSFORM] Processing market ${index + 1}/${externalData.data.length}: ${market.mname || 'Unknown'}`);
      logger.info(`🔄 [TRANSFORM] Market structure: ${JSON.stringify({
        mname: market.mname,
        hasSection: !!market.section,
        sectionType: typeof market.section,
        isSectionArray: Array.isArray(market.section),
        sectionLength: Array.isArray(market.section) ? market.section.length : 'N/A',
        status: market.status,
        min: market.min,
        max: market.max
      })}`);

      if (market.section && Array.isArray(market.section)) {
        logger.info(`🔄 [TRANSFORM] Market ${market.mname} has ${market.section.length} sections, processing...`);
        
        const transformedMarket = {
          id: market.mname?.toLowerCase().replace(/[^a-z0-9]/g, '_') || `market_${index}`,
          marketId: market.mname?.toLowerCase().replace(/[^a-z0-9]/g, '_') || `market_${index}`,
          name: market.mname || `Market ${index + 1}`,
          type: getMarketType(market.mname),
          gtype: getMarketGType(market.mname),
          minStake: market.min || 100,
          maxStake: market.max || 500000,
          status: market.status === 'OPEN' ? 'active' : 'suspended',
          selections: []
        };

        logger.info(`🔄 [TRANSFORM] Created transformed market: ${JSON.stringify({
          id: transformedMarket.id,
          name: transformedMarket.name,
          type: transformedMarket.type,
          minStake: transformedMarket.minStake,
          maxStake: transformedMarket.maxStake,
          status: transformedMarket.status
        })}`);

        // Transform selections
        market.section.forEach((section, secIndex) => {
          logger.info(`🔄 [TRANSFORM] Processing section ${secIndex + 1}/${market.section.length}: ${section.nat || 'Unknown'}`);
          logger.info(`🔄 [TRANSFORM] Section structure: ${JSON.stringify({
            nat: section.nat,
            hasOdds: !!section.odds,
            oddsType: typeof section.odds,
            isOddsArray: Array.isArray(section.odds),
            oddsLength: Array.isArray(section.odds) ? section.odds.length : 'N/A',
            gstatus: section.gstatus
          })}`);

          if (section.odds && Array.isArray(section.odds)) {
            logger.info(`🔄 [TRANSFORM] Section ${section.nat} has ${section.odds.length} odds entries`);
            
            // Get the best back odds (lowest odds = best for backers)
            const backOdds = section.odds.filter(odd => odd.otype === 'back' && odd.odds > 0);
            logger.info(`🔄 [TRANSFORM] Found ${backOdds.length} valid back odds: ${JSON.stringify(backOdds.map(o => ({ odds: o.odds, size: o.size })))}`);
            
            // Get the best lay odds (highest odds = best for layers)
            const layOdds = section.odds.filter(odd => odd.otype === 'lay' && odd.odds > 0);
            logger.info(`🔄 [TRANSFORM] Found ${layOdds.length} valid lay odds: ${JSON.stringify(layOdds.map(o => ({ odds: o.odds, size: o.size })))}`);
            
            if (backOdds.length > 0) {
              // Add ALL back odds options (sorted from best to worst)
              const sortedBackOdds = backOdds.sort((a, b) => a.odds - b.odds);
              logger.info(`🔄 [TRANSFORM] Adding ${sortedBackOdds.length} back odds options: ${JSON.stringify(sortedBackOdds.map(o => ({ odds: o.odds, size: o.size })))}`);
              
              sortedBackOdds.forEach((backOdd, oddIndex) => {
                // Check if gstatus is at odd level or section level
                const gstatus = backOdd.gstatus || section.gstatus || 'ACTIVE';
                
                // Debug logging for gstatus values
                logger.info(`🔍 [DEBUG] Back odd gstatus - odd: ${backOdd.gstatus}, section: ${section.gstatus}, final: ${gstatus}`);
                
                transformedMarket.selections.push({
                  id: `${transformedMarket.id}_${secIndex}_back_${oddIndex}`,
                  name: section.nat || `Selection ${secIndex + 1}`,
                  odds: backOdd.odds,
                  stake: backOdd.size || 0,
                  status: (gstatus && gstatus !== 'ACTIVE') ? 'suspended' : 'active',
                  gstatus: gstatus, // Preserve the gstatus field (from odd or section)
                  type: 'back',
                  tier: oddIndex + 1 // 1 = best, 2 = second best, etc.
                });
                
                logger.info(`🔄 [TRANSFORM] Added back selection tier ${oddIndex + 1}: ${JSON.stringify({
                  id: `${transformedMarket.id}_${secIndex}_back_${oddIndex}`,
                  name: section.nat || `Selection ${secIndex + 1}`,
                  odds: backOdd.odds,
                  stake: backOdd.size || 0,
                  status: (gstatus && gstatus !== 'ACTIVE') ? 'suspended' : 'active',
                  gstatus: gstatus, // Use the correct gstatus variable
                  type: 'back',
                  tier: oddIndex + 1
                })}`);
              });
            } else {
              logger.warn(`⚠️ [TRANSFORM] No valid back odds found for section ${section.nat}`);
            }
            
            if (layOdds.length > 0) {
              // Add ALL lay odds options (sorted from best to worst)
              const sortedLayOdds = layOdds.sort((a, b) => b.odds - a.odds);
              logger.info(`🔄 [TRANSFORM] Adding ${sortedLayOdds.length} lay odds options: ${JSON.stringify(sortedLayOdds.map(o => ({ odds: o.odds, size: o.size })))}`);
              
              sortedLayOdds.forEach((layOdd, oddIndex) => {
                // Check if gstatus is at odd level or section level
                const gstatus = layOdd.gstatus || section.gstatus || 'ACTIVE';
                
                // Debug logging for gstatus values
                logger.info(`🔍 [DEBUG] Lay odd gstatus - odd: ${layOdd.gstatus}, section: ${section.gstatus}, final: ${gstatus}`);
                
                transformedMarket.selections.push({
                  id: `${transformedMarket.id}_${secIndex}_lay_${oddIndex}`,
                  name: section.nat || `Selection ${secIndex + 1}`,
                  odds: layOdd.odds,
                  stake: layOdd.size || 0,
                  status: (gstatus && gstatus !== 'ACTIVE') ? 'suspended' : 'active',
                  gstatus: gstatus, // Preserve the gstatus field (from odd or section)
                  type: 'lay',
                  tier: oddIndex + 1 // 1 = best, 2 = second best, etc.
                });
                
                logger.info(`🔄 [TRANSFORM] Added lay selection tier ${oddIndex + 1}: ${JSON.stringify({
                  id: `${transformedMarket.id}_${secIndex}_lay_${oddIndex}`,
                  name: section.nat || `Selection ${secIndex + 1}`,
                  odds: layOdd.odds,
                  stake: layOdd.size || 0,
                  status: (gstatus && gstatus !== 'ACTIVE') ? 'suspended' : 'active',
                  gstatus: gstatus, // Use the correct gstatus variable
                  type: 'lay',
                  tier: oddIndex + 1
                })}`);
              });
            } else {
              logger.warn(`⚠️ [TRANSFORM] No valid lay odds found for section ${section.nat}`);
            }
          } else {
            logger.warn(`⚠️ [TRANSFORM] Section ${section.nat} has no valid odds data`);
          }
        });

        if (transformedMarket.selections.length > 0) {
          markets.push(transformedMarket);
          logger.info(`✅ [TRANSFORM] Market ${transformedMarket.name} added with ${transformedMarket.selections.length} selections`);
        } else {
          logger.warn(`⚠️ [TRANSFORM] Market ${transformedMarket.name} has no selections, skipping`);
        }
      } else {
        logger.warn(`⚠️ [TRANSFORM] Market ${market.mname || index} has no valid section data, skipping`);
      }
    });

    logger.info(`✅ [TRANSFORM] Transformation completed. Total markets: ${markets.length}`);
    logger.info(`✅ [TRANSFORM] Final markets structure: ${JSON.stringify(markets.map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
      selectionsCount: m.selections.length
    })))}`);

    return {
      matchId: matchId,
      lastUpdated: new Date().toISOString(),
      markets: markets,
      source: 'shamexch.xyz',
      success: true,
      
      // Enhanced match metadata for auto-sync
      eventId: matchId,
      eventName: externalData.eventName || externalData.name || `Match ${matchId}`,
      status: externalData.status || externalData.iplay || 'upcoming',
      iplay: externalData.iplay || externalData.inPlay || false,
      inPlay: externalData.inPlay || externalData.iplay || false,
      tournament: externalData.tournament || externalData.cname || 'Cricket Match',
      cname: externalData.cname || externalData.tournament || 'Cricket Match',
      startTime: externalData.startTime || externalData.stime || null,
      stime: externalData.stime || externalData.startTime || null,
      teams: externalData.teams || externalData.brunners || null,
      brunners: externalData.brunners || externalData.teams || null,
      matchType: externalData.matchType || externalData.gtype || 'match',
      gtype: externalData.gtype || externalData.matchType || 'match',
      apiSource: 'shamexch.xyz',
      bmarketId: externalData.bmarketId || externalData.marketId || null,
      
      // Raw data for additional processing
      raw: externalData
    };

  } catch (error) {
    logger.error(`❌ [TRANSFORM] Error transforming odds: ${error.message}`);
    logger.error(`❌ [TRANSFORM] Error stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Determine market type based on market name
 */
function getMarketType(marketName) {
  logger.info(`🏷️ [MARKET_TYPE] Determining market type for: ${marketName}`);
  
  if (!marketName) {
    logger.warn(`🏷️ [MARKET_TYPE] No market name provided, defaulting to 'custom'`);
    return 'custom';
  }
  
  const name = marketName.toLowerCase();
  logger.info(`🏷️ [MARKET_TYPE] Normalized market name: ${name}`);
  
  if (name.includes('match_odds') || name.includes('match')) {
    logger.info(`🏷️ [MARKET_TYPE] Detected 'match_winner' type`);
    return 'match_winner';
  }
  if (name.includes('tied') || name.includes('draw')) {
    logger.info(`🏷️ [MARKET_TYPE] Detected 'tied_match' type`);
    return 'tied_match';
  }
  if (name.includes('over') || name.includes('under') || name.includes('runs') || name.includes('inn') || name.includes('over')) {
    logger.info(`🏷️ [MARKET_TYPE] Detected 'cricketcasino' type`);
    return 'cricketcasino';
  }
  
  logger.info(`🏷️ [MARKET_TYPE] No specific type detected, defaulting to 'custom'`);
  return 'custom';
}

/**
 * Determine market gtype (fancy, match_odds, session) based on market name
 */
function getMarketGType(marketName) {
  logger.info(`🏷️ [MARKET_GTYPE] Determining market gtype for: ${marketName}`);
  
  if (!marketName) {
    logger.warn(`🏷️ [MARKET_GTYPE] No market name provided, defaulting to 'match_odds'`);
    return 'match_odds';
  }
  
  const name = marketName.toLowerCase();
  logger.info(`🏷️ [MARKET_GTYPE] Normalized market name: ${name}`);
  
  if (name.includes('fancy') || name.includes('casino') || name.includes('over') || name.includes('under')) {
    logger.info(`🏷️ [MARKET_GTYPE] Detected 'fancy' type`);
    return 'fancy';
  }
  if (name.includes('session') || name.includes('inning') || name.includes('over_by_over')) {
    logger.info(`🏷️ [MARKET_GTYPE] Detected 'session' type`);
    return 'session';
  }
  if (name.includes('match') || name.includes('winner') || name.includes('tied')) {
    logger.info(`🏷️ [MARKET_GTYPE] Detected 'match_odds' type`);
    return 'match_odds';
  }
  
  logger.info(`🏷️ [MARKET_GTYPE] No specific gtype detected, defaulting to 'match_odds'`);
  return 'match_odds';
}

module.exports = router;