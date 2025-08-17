const express = require('express');
const router = express.Router();
const { getCricketFixturesSnapshot } = require('../services/fixturesService');
const redis = require('../utils/redisClient'); // Import at module level
const { normalizeFixtureId } = require('../utils/normalizeFixtureId');
const axios = require('axios');

// -------------------- In-memory cache for cricket matches --------------------
const UPSTREAM_CRICKET_URL = 'https://marketsarket.qnsports.live/cricketmatches';
let cricketCache = {
  data: null,
  lastUpdated: 0,
};

// Helper: fetch from upstream and transform
async function fetchAndTransformCricketMatches() {
  const startTime = Date.now();
  try {
    console.log(`🔄 [FETCH] Starting upstream fetch from: ${UPSTREAM_CRICKET_URL}`);
    
    const { data } = await axios.get(UPSTREAM_CRICKET_URL, { timeout: 10000 });
    const fetchTime = Date.now() - startTime;
    
    console.log(`✅ [FETCH] Upstream API responded in ${fetchTime}ms`);
    console.log(`✅ [FETCH] Raw response structure: hasData=${!!data}, dataType=${typeof data}, isArray=${Array.isArray(data)}, hasT1=${!!(data && data.t1)}, t1Length=${data && data.t1 && Array.isArray(data.t1) ? data.t1.length : 'N/A'}`);
    
    // Handle the t1 wrapper from upstream API
    let fixturesArray = data;
    if (data && data.t1 && Array.isArray(data.t1)) {
      fixturesArray = data.t1;
      console.log(`📋 [FETCH] Upstream returned ${fixturesArray.length} fixtures wrapped in t1 property`);
    } else if (!Array.isArray(data)) {
      console.error(`❌ [FETCH] Invalid upstream response format`);
      throw new Error('Upstream response is not an array and does not contain t1 property');
    } else {
      console.log(`📋 [FETCH] Upstream returned ${fixturesArray.length} fixtures directly`);
    }

    const transformedFixtures = fixturesArray.map((match) => {
      const beventId = match.beventId || match.eventId || null;
      const bmarketId = match.bmarketId || match.marketId || null;

      const transformed = { ...match };

      // Ensure we always have beventId and bmarketId fields (if derivable)
      if (!transformed.beventId && beventId) {
        transformed.beventId = String(beventId);
      }
      if (!transformed.bmarketId && bmarketId) {
        transformed.bmarketId = String(bmarketId);
      }

      // Rewrite the primary id for convenience in frontend
      if (beventId) {
        transformed.id = bmarketId ? `${beventId}(${bmarketId})` : String(beventId);
      }

      return transformed;
    });

    console.log(`🔄 [FETCH] Transformed ${transformedFixtures.length} fixtures`);

    // Save fixtures to database (fire-and-forget, don't block response)
    try {
      const saveUrl = 'http://localhost:3000/api/cricket/save-fixtures';
      console.log(`💾 [FETCH] Saving ${transformedFixtures.length} fixtures to database...`);
      
      // Use axios to POST fixtures to the database API
      const saveResponse = await axios.post(saveUrl, { 
        fixtures: transformedFixtures 
      }, { 
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (saveResponse.status === 200) {
        console.log(`✅ [FETCH] Database save successful: ${saveResponse.data.savedCount} fixtures saved`);
      } else {
        console.warn(`⚠️ [FETCH] Database save returned status ${saveResponse.status}`);
      }
    } catch (saveError) {
      console.warn(`⚠️ [FETCH] Failed to save fixtures to database: ${saveError.message}`);
      // Don't fail the main request if database save fails
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ [FETCH] Function completed in ${totalTime}ms`);
    return transformedFixtures;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [FETCH] Error in fetchAndTransformCricketMatches after ${totalTime}ms: ${error.message}`);
    console.error(`❌ [FETCH] Error stack: ${error.stack}`);
    throw error;
  }
}

// Refresh cache (called on demand and by interval)
async function refreshCricketCache() {
  const startTime = Date.now();
  try {
    console.log(`🔄 [REFRESH] Starting cricket cache refresh...`);
    const fresh = await fetchAndTransformCricketMatches();
    cricketCache.data = fresh;
    cricketCache.lastUpdated = Date.now();
    const totalTime = Date.now() - startTime;
    console.log(`✅ [REFRESH] Cricket cache refreshed in ${totalTime}ms – ${fresh.length} matches`);
  } catch (err) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [REFRESH] Failed to refresh cricket cache after ${totalTime}ms: ${err.message}`);
    console.error(`❌ [REFRESH] Error stack: ${err.stack}`);
  }
}

// Kick-off background refresh every 30 s (non-blocking)
setInterval(() => {
  refreshCricketCache();
}, 30_000);

// Initial warm-up (do not block module load)
refreshCricketCache();

// Add Redis event listeners for debugging
console.log('🔌 Public provider: Setting up Redis event listeners...');
try {
  if (redis.client && typeof redis.client.on === 'function') {
    redis.client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });
    redis.client.on('connect', () => {
      console.log('🔌 Redis Client Connected');
    });
    redis.client.on('ready', () => {
      console.log('✅ Redis Client Ready');
    });
    redis.client.on('close', () => {
      console.log('🔌 Redis Client Closed');
    });
    redis.client.on('reconnecting', () => {
      console.log('🔄 Redis Client Reconnecting');
    });
    console.log('✅ Public provider: Redis event listeners set up successfully');
  } else {
    console.log('⚠️ Public provider: Redis client not available for event listeners');
  }
} catch (error) {
  console.log('⚠️ Public provider: Failed to set up Redis event listeners:', error.message);
}

// Public provider endpoints - no authentication required

// GET /provider/cricketmatches - Public endpoint for cricket matches
router.get('/cricketmatches', async (req, res) => {
  const startTime = Date.now();
  try {
    console.log(`🎯 [MATCHES] Starting cricket matches fetch`);
    console.log(`🎯 [MATCHES] Request headers: ${JSON.stringify(req.headers)}`);
    console.log(`🎯 [MATCHES] Request IP: ${req.ip}`);

    // First, try to get cached fixtures from Redis (populated by background workers)
    console.log(`🎯 [MATCHES] Checking Redis cache for key: cricket:fixtures`);
    const cachedFixtures = await redis.get('cricket:fixtures');
    
    if (cachedFixtures) {
      try {
        console.log(`🎯 [MATCHES] Redis cache HIT - data size: ${cachedFixtures.length} characters`);
        const fixturesData = JSON.parse(cachedFixtures);
        if (fixturesData && Array.isArray(fixturesData) && fixturesData.length > 0) {
          console.log(`✅ [MATCHES] Returning ${fixturesData.length} cached fixtures from Redis`);
          const totalTime = Date.now() - startTime;
          console.log(`✅ [MATCHES] Request completed in ${totalTime}ms`);
          return res.status(200).json(fixturesData);
        } else {
          console.log(`⚠️ [MATCHES] Redis cache data is invalid: hasData=${!!fixturesData}, isArray=${Array.isArray(fixturesData)}, length=${Array.isArray(fixturesData) ? fixturesData.length : 'N/A'}`);
        }
      } catch (parseError) {
        console.warn(`⚠️ [MATCHES] Failed to parse cached fixtures: ${parseError.message}`);
      }
    } else {
      console.log(`📋 [MATCHES] Redis cache MISS - no cached fixtures found`);
    }

    // If no Redis cache, try the local cache
    console.log(`🎯 [MATCHES] Checking local cache: hasData=${!!cricketCache.data}, dataLength=${cricketCache.data ? cricketCache.data.length : 'N/A'}, lastUpdated=${cricketCache.lastUpdated}, cacheAge=${Date.now() - cricketCache.lastUpdated}ms`);
    
    if (cricketCache.data && cricketCache.data.length > 0) {
      const cacheAge = Date.now() - cricketCache.lastUpdated;
      if (cacheAge <= 30_000) { // Only use if cache is fresh
        console.log(`✅ [MATCHES] Returning ${cricketCache.data.length} fixtures from local cache`);
        const totalTime = Date.now() - startTime;
        console.log(`✅ [MATCHES] Request completed in ${totalTime}ms`);
        return res.status(200).json(cricketCache.data);
      } else {
        console.log(`⚠️ [MATCHES] Local cache is stale (age: ${cacheAge}ms)`);
      }
    } else {
      console.log(`📋 [MATCHES] Local cache is empty`);
    }

    // If cache is empty/stale, attempt refresh but do not block response
    console.log(`🔄 [MATCHES] Triggering background cache refresh...`);
    refreshCricketCache(); // fire-and-forget

    // No cache available yet – return empty array instead of error
    console.log(`⚠️ [MATCHES] No fixtures cache available, returning empty array`);
    const totalTime = Date.now() - startTime;
    console.log(`⚠️ [MATCHES] Request completed in ${totalTime}ms (empty response)`);
    return res.status(200).json([]);
    
  } catch (err) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [MATCHES] Error in cricketmatches endpoint after ${totalTime}ms: ${err.message}`);
    console.error(`❌ [MATCHES] Error stack: ${err.stack}`);
    // Return empty array instead of error to avoid breaking frontend
    return res.status(200).json([]);
  }
});

// GET /provider/health - Public health check
router.get('/health', async (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      message: 'Public provider endpoint is healthy',
      timestamp: new Date().toISOString(),
      source: 'public-provider'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Public provider health check failed',
      error: error.message,
      source: 'public-provider'
    });
  }
});

// GET /provider/test-redis - Test Redis connection and basic operations
router.get('/test-redis', async (req, res) => {
  try {
    console.log('🧪 Public provider: Testing Redis connection...');
    
    // Test 1: Check connection status
    const connectionStatus = redis.getConnectionStatus();
    console.log('🔍 Redis connection status:', connectionStatus);
    
    // Test 2: Test basic set/get operations
    const testKey = 'test-key';
    const testValue = 'test-value-' + Date.now();
    
    console.log(`🧪 Testing Redis set: ${testKey} = ${testValue}`);
    await redis.set(testKey, testValue, 60); // 1 minute TTL
    
    console.log('🧪 Testing Redis get...');
    const retrievedValue = await redis.get(testKey);
    
    console.log('🧪 Testing Redis exists...');
    const keyExists = await redis.exists(testKey);
    
    console.log('🧪 Testing Redis TTL...');
    const ttl = await redis.ttl(testKey);
    
    // Test 3: Test with JSON data
    const jsonKey = 'test-json';
    const jsonData = { message: 'Hello Redis', timestamp: new Date().toISOString() };
    
    console.log(`🧪 Testing Redis JSON set: ${jsonKey}`);
    await redis.set(jsonKey, jsonData, 60);
    
    console.log('🧪 Testing Redis JSON get...');
    const retrievedJson = await redis.get(jsonKey);
    
    // Clean up test keys
    await redis.del(testKey);
    await redis.del(jsonKey);
    
    const testResults = {
      connectionStatus,
      basicTest: {
        set: true,
        get: retrievedValue === testValue,
        exists: keyExists,
        ttl: ttl > 0,
        retrievedValue
      },
      jsonTest: {
        set: true,
        get: retrievedJson && retrievedJson.message === 'Hello Redis',
        retrievedJson
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Redis test completed successfully:', testResults);
    
    res.json({
      success: true,
      message: 'Redis connection test completed',
      results: testResults,
      source: 'public-provider-redis-test'
    });
    
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Redis test failed', 
      message: error.message,
      source: 'public-provider-redis-test'
    });
  }
});

module.exports = router;