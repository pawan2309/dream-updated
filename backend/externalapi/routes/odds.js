const express = require('express');
const router = express.Router();
const redis = require('../utils/redisClient');
const logger = require('../utils/logger');
const config = require('../../config');

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
          name: market.mname || `Market ${index + 1}`,
          type: getMarketType(market.mname),
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
                transformedMarket.selections.push({
                  id: `${transformedMarket.id}_${secIndex}_back_${oddIndex}`,
                  name: section.nat || `Selection ${secIndex + 1}`,
                  odds: backOdd.odds,
                  stake: backOdd.size || 0,
                  status: section.gstatus === 'ACTIVE' ? 'active' : 'suspended',
                  type: 'back',
                  tier: oddIndex + 1 // 1 = best, 2 = second best, etc.
                });
                
                logger.info(`🔄 [TRANSFORM] Added back selection tier ${oddIndex + 1}: ${JSON.stringify({
                  id: `${transformedMarket.id}_${secIndex}_back_${oddIndex}`,
                  name: section.nat || `Selection ${secIndex + 1}`,
                  odds: backOdd.odds,
                  stake: backOdd.size || 0,
                  status: section.gstatus === 'ACTIVE' ? 'active' : 'suspended',
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
                transformedMarket.selections.push({
                  id: `${transformedMarket.id}_${secIndex}_lay_${oddIndex}`,
                  name: section.nat || `Selection ${secIndex + 1}`,
                  odds: layOdd.odds,
                  stake: layOdd.size || 0,
                  status: section.gstatus === 'ACTIVE' ? 'active' : 'suspended',
                  type: 'lay',
                  tier: oddIndex + 1 // 1 = best, 2 = second best, etc.
                });
                
                logger.info(`🔄 [TRANSFORM] Added lay selection tier ${oddIndex + 1}: ${JSON.stringify({
                  id: `${transformedMarket.id}_${secIndex}_lay_${oddIndex}`,
                  name: section.nat || `Selection ${secIndex + 1}`,
                  odds: layOdd.odds,
                  stake: layOdd.size || 0,
                  status: section.gstatus === 'ACTIVE' ? 'active' : 'suspended',
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
      success: true
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

module.exports = router;