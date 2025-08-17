const logger = require('../utils/logger');
const redis = require('../utils/redis');
const config = require('../../config');

/**
 * Cricket Worker - Fetches cricket data from external APIs
 * This worker processes jobs from the cricket-data-queue
 */
async function processCricketJob(job) {
    try {
        logger.info(`🔄 Processing cricket job ${job.id} of type ${job.name}`);
        logger.info(`📋 Job data:`, job.data);
        
        const { data } = job;
        const { eventId, forceRefresh = false } = data;
        
        // Debug: Log the entire job object to see what's available
        logger.info(`🔍 Full job object:`, {
            jobId: job.id,
            jobName: job.name,
            jobData: job.data,
            jobKeys: Object.keys(job),
            dataKeys: Object.keys(data || {})
        });
        
        const jobType = job.name; // Use job name instead of data.jobType
        
        logger.info(`🔍 Job details:`, {
            jobId: job.id,
            jobName: job.name,
            jobType,
            eventId,
            forceRefresh
        });
        
        let result;
        
        switch (jobType) {
            case 'fetch-fixtures':
                logger.info(`🎯 Processing fetchFixtures job...`);
                result = await fetchCricketFixtures(forceRefresh);
                break;
                
            case 'fetch-cricket-scorecards':
                if (!eventId) {
                    throw new Error('eventId required for fetchScorecard job');
                }
                logger.info(`🎯 Processing fetchScorecard job for event: ${eventId}`);
                result = await fetchCricketScorecard(eventId, forceRefresh);
                break;
                
            case 'fetch-cricket-odds':
                logger.info(`🎯 Processing fetchOdds job...`);
                result = await fetchCricketOdds(forceRefresh);
                break;
                
            default:
                logger.error(`❌ Unknown job type: ${jobType}`);
                throw new Error(`Unknown cricket job type: ${jobType}`);
        }
        
        logger.info(`✅ Cricket job ${job.id} completed successfully`);
        logger.info(`📊 Job result:`, {
            type: typeof result,
            isArray: Array.isArray(result),
            length: Array.isArray(result) ? result.length : 'N/A'
        });
        
        return result;
        
    } catch (error) {
        logger.error(`❌ Cricket job ${job.id} failed:`, error);
        logger.error(`❌ Error details:`, {
            message: error.message,
            stack: error.stack,
            name: error.name,
            jobId: job.id,
            jobType: job.data?.jobType
        });
        throw error; // Re-throw for BullMQ retry handling
    }
}

/**
 * Fetch cricket fixtures from external API
 */
async function fetchCricketFixtures(forceRefresh = false) {
    try {
        const cacheKey = 'cricket:fixtures';
        
        logger.info(`🔍 Starting fetchCricketFixtures - forceRefresh: ${forceRefresh}`);
        logger.info(`🌐 API URL: ${config.api.cricketFixtures}`);
        
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            logger.info('🔍 Checking Redis cache...');
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info(`📋 Cache HIT - Returning ${cached.length} cached fixtures`);
                return cached;
            } else {
                logger.info('📋 Cache MISS - No cached data found');
            }
        } else {
            logger.info('🔄 Force refresh - skipping cache check');
        }
        
        logger.info('🌐 Fetching fresh cricket fixtures from API...');
        logger.info(`📡 Making HTTP request to: ${config.api.cricketFixtures}`);
        
        // Log request details
        const requestStart = Date.now();
        
        // Fetch from external API
        const response = await fetch(config.api.cricketFixtures);
        const requestTime = Date.now() - requestStart;
        
        logger.info(`📡 HTTP Response received in ${requestTime}ms`);
        logger.info(`📡 Response status: ${response.status}`);
        logger.info(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`❌ API Error Response: ${errorText}`);
            logger.error(`❌ API URL: ${config.api.cricketFixtures}`);
            logger.error(`❌ Response Status: ${response.status}`);
            throw new Error(`API responded with status: ${response.status}, URL: ${config.api.cricketFixtures} - ${errorText}`);
        }
        
        logger.info('📡 Parsing response as JSON...');
        const fixtures = await response.json();
        
        logger.info(`📊 Raw API response:`, {
            type: typeof fixtures,
            isArray: Array.isArray(fixtures),
            length: Array.isArray(fixtures) ? fixtures.length : 'N/A',
            sample: Array.isArray(fixtures) && fixtures.length > 0 ? fixtures[0] : 'No data'
        });
        
        // Handle the actual API response structure: { t1: [...], t2: [...] }
        let cricketFixtures = [];
        
        if (Array.isArray(fixtures)) {
            // Direct array response (fallback)
            cricketFixtures = fixtures;
            logger.info(`📊 Direct array response with ${cricketFixtures.length} fixtures`);
        } else if (fixtures && typeof fixtures === 'object') {
            // Extract cricket fixtures from t1 array (main cricket matches)
            if (fixtures.t1 && Array.isArray(fixtures.t1)) {
                cricketFixtures = fixtures.t1;
                logger.info(`📊 Extracted ${cricketFixtures.length} cricket fixtures from t1 array`);
            }
            
            // Also check t2 array for additional cricket matches
            if (fixtures.t2 && Array.isArray(fixtures.t2)) {
                logger.info(`📊 Found ${fixtures.t2.length} additional matches in t2 array`);
                // You can merge t2 if needed, or keep them separate
            }
            
            logger.info(`📊 Total cricket fixtures extracted: ${cricketFixtures.length}`);
        }
        
        if (cricketFixtures.length === 0) {
            logger.warn('⚠️ No cricket fixtures found in API response');
            logger.warn(`⚠️ Response structure:`, fixtures);
            // Still cache empty result to avoid hammering the API
            await redis.set(cacheKey, [], config.ttl.cricketFixtures);
            return [];
        }
        
        logger.info(`📊 Processing ${cricketFixtures.length} cricket fixtures...`);
        
        // Normalize and cache the data
        const normalized = normalizeFixtures(cricketFixtures);
        logger.info(`📊 Normalized ${normalized.length} fixtures`);
        
        // Log sample normalized data
        if (normalized.length > 0) {
            logger.info(`📊 Sample normalized fixture:`, normalized[0]);
        }
        
        // Cache with proper TTL for live data
        await redis.set(cacheKey, normalized, config.ttl.cricketFixtures);
        logger.info(`💾 Cached ${normalized.length} fixtures in Redis with TTL: ${config.ttl.cricketFixtures}s`);
        
        // Also cache individual fixtures for quick access
        for (const fixture of normalized) {
            const individualKey = `fixture:${fixture.id}`;
            await redis.set(individualKey, fixture, config.ttl.cricketFixtures);
        }
        logger.info(`💾 Cached ${normalized.length} individual fixtures with TTL: ${config.ttl.cricketFixtures}s`);
        
        logger.info(`✅ Successfully fetched and cached ${normalized.length} cricket fixtures`);
        return normalized;
        
    } catch (error) {
        logger.error('❌ Failed to fetch cricket fixtures:', error);
        logger.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

/**
 * Fetch detailed scorecard for a specific match
 */
async function fetchCricketScorecard(eventId, forceRefresh = false) {
    try {
        const cacheKey = `cricket:scorecard:${eventId}`;
        
        // Check cache first
        if (!forceRefresh) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info(`📋 Returning cached scorecard for event ${eventId}`);
                return cached;
            }
        }
        
        logger.info(`🌐 Fetching fresh scorecard for event ${eventId}...`);
        
        // Fetch from external API
        const response = await fetch(`${config.api.cricketScorecardDetailed}${eventId}`);
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const scorecard = await response.json();
        
        // Cache the scorecard
        await redis.set(cacheKey, scorecard, config.ttl.cricketScorecard);
        
        logger.info(`✅ Fetched and cached scorecard for event ${eventId}`);
        return scorecard;
        
    } catch (error) {
        logger.error(`❌ Failed to fetch scorecard for event ${eventId}:`, error);
        throw error;
    }
}

/**
 * Fetch cricket odds from external API
 */
async function fetchCricketOdds(forceRefresh = false) {
    try {
        const cacheKey = 'cricket:odds';
        
        // Check cache first
        if (!forceRefresh) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info('📋 Returning cached cricket odds');
                return cached;
            }
        }
        
        logger.info('🌐 Fetching fresh cricket odds from API...');
        
        // First, fetch fresh fixtures data since Redis data might be corrupted
        try {
            const fixturesUrl = 'https://marketsarket.qnsports.live/cricketmatches';
            logger.info(`🔗 Fetching fresh fixtures from: ${fixturesUrl}`);
            
            const fixturesResponse = await fetch(fixturesUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'BettingPlatform/1.0'
                },
                timeout: 10000
            });

            if (!fixturesResponse.ok) {
                logger.error(`❌ Failed to fetch fixtures: ${fixturesResponse.status} ${fixturesResponse.statusText}`);
                throw new Error(`Fixtures API responded with status: ${fixturesResponse.status}`);
            }

            const fixturesData = await fixturesResponse.json();
            if (!fixturesData || !fixturesData.t1 || !Array.isArray(fixturesData.t1)) {
                logger.error('❌ Invalid fixtures response format - expected {t1: [...]}');
                throw new Error('Invalid fixtures response format - expected {t1: [...]}');
            }

            logger.info(`🔍 Processing ${fixturesData.t1.length} fresh fixtures`);
            
            const allOdds = [];
            
            // Process each fixture and extract odds
            fixturesData.t1.forEach((fixture, index) => {
                try {
                    const eventId = fixture.beventId || fixture.eventId || fixture.id;
                    if (!eventId) {
                        logger.warn(`⚠️ Fixture ${index} has no event ID, skipping`);
                        return;
                    }

                    // Check if fixture has odds data embedded
                    if (fixture.section && Array.isArray(fixture.section)) {
                        const oddsData = {
                            eventId: eventId,
                            matchId: fixture.gmid || fixture.id,
                            matchName: fixture.ename || `Match ${index + 1}`,
                            tournament: fixture.cname || 'Unknown',
                            status: fixture.status || 'unknown',
                            inPlay: fixture.iplay || false,
                            odds: fixture.section,
                            lastUpdated: new Date().toISOString(),
                            source: 'marketsarket.qnsports.live'
                        };
                        
                        allOdds.push(oddsData);
                        logger.info(`✅ Extracted odds for event ${eventId}: ${fixture.ename}`);
                    } else {
                        logger.warn(`⚠️ Fixture ${fixture.ename || index} has no embedded odds data`);
                    }
                    
                } catch (error) {
                    logger.error(`❌ Error processing fixture ${index}: ${error.message}`);
                    // Continue with next fixture
                }
            });
            
            if (allOdds.length === 0) {
                logger.warn('⚠️ No odds data extracted from fixtures');
                return [];
            }

            // Cache the extracted odds
            await redis.set(cacheKey, allOdds, config.ttl.cricketOdds);
            
            logger.info(`✅ Extracted and cached cricket odds for ${allOdds.length} fixtures`);
            return allOdds;
            
        } catch (error) {
            logger.error(`❌ Failed to fetch fresh fixtures: ${error.message}`);
            throw error;
        }
        
    } catch (error) {
        logger.error('❌ Failed to fetch cricket odds:', error);
        throw error;
    }
}

/**
 * Normalize fixtures data structure
 */
function normalizeFixtures(fixtures) {
    logger.info(`🔧 Starting normalizeFixtures with ${fixtures.length} fixtures`);
    
    if (!Array.isArray(fixtures)) {
        logger.warn(`⚠️ normalizeFixtures: Input is not an array: ${typeof fixtures}`);
        return [];
    }
    
    if (fixtures.length === 0) {
        logger.info('🔧 normalizeFixtures: Empty array, nothing to normalize');
        return [];
    }
    
    // Log sample raw fixture for debugging
    logger.info(`🔧 Sample raw fixture:`, fixtures[0]);
    
    const normalized = fixtures.map((fixture, index) => {
        // ----- ID extraction --------
        const beventId = fixture.beventId || fixture.eventId || (fixture.event && fixture.event.id) || fixture.id || null;
        const bmarketId = fixture.bmarketId || fixture.marketId || fixture.bettingMarketId || null;
        const baseId = beventId || fixture.id || fixture.matchId || fixture._id;
 
        if (!baseId) {
            logger.warn(`⚠️ Fixture ${index} has no IDs, skipping`);
            return null;
        }
        const finalBeventId = beventId || baseId;
        const finalBmarketId = bmarketId || `${baseId}.1`;
        const finalId = finalBeventId;
        
        // Debug: Log the ID processing
        if (index < 3) { // Only log first 3 for debugging
            logger.info(`🔍 Fixture ${index + 1} ID processing:`, {
                original: { beventId, bmarketId, baseId },
                final: { finalBeventId, finalBmarketId, finalId }
            });
        }
        
        // Handle the actual API response structure
        const normalizedFixture = {
            // Use the actual IDs from API
            id: finalId,
            beventId: finalBeventId,
            bmarketId: finalBmarketId,
            name: fixture.ename || fixture.eventName || fixture.name,
            startTime: fixture.stime || fixture.startTime || fixture.startDate,
            status: fixture.status || 'scheduled',
            tournament: fixture.cname || fixture.tournament || '',
            matchType: fixture.gtype || 'match',
            inPlay: fixture.iplay || false,
            isCricket: fixture.iscc === 1 || fixture.iscc === 0,
            lastUpdated: new Date().toISOString()
        };
        
        // Extract team information if available
        if (fixture.brunners && Array.isArray(fixture.brunners)) {
            normalizedFixture.teams = fixture.brunners.map(runner => ({
                name: runner.runnerName,
                selectionId: runner.selectionId,
                handicap: runner.handicap,
                sortPriority: runner.sortPriority
            }));
        } else if (fixture.teams) {
            normalizedFixture.teams = fixture.teams;
        } else {
            normalizedFixture.teams = [];
        }
        
        // Log first few normalizations for debugging
        if (index < 3) {
            logger.info(`🔧 Normalized fixture ${index + 1}:`, normalizedFixture);
        }
        
        return normalizedFixture;
    });
    
    // Filter out null values (fixtures with no ID)
    const validNormalizedFixtures = normalized.filter(fixture => fixture !== null);
    
    logger.info(`🔧 Successfully normalized ${validNormalizedFixtures.length} fixtures`);
    return validNormalizedFixtures;
}

/**
 * Update match status and clean up completed matches
 */
async function updateMatchStatus(matchId, newStatus) {
    try {
        const individualKey = `fixture:${matchId}`;
        
        if (newStatus === 'completed' || newStatus === 'finished') {
            // Remove from live fixtures cache
            await redis.del(individualKey);
            logger.info(`🗑️ Removed completed match ${matchId} from live cache`);
            
            // TODO: Store in PostgreSQL for historical data
            // await storeMatchInDatabase(matchId, matchData);
        } else {
            // Update status in cache
            const match = await redis.get(individualKey);
            if (match) {
                match.status = newStatus;
                match.lastUpdated = new Date().toISOString();
                await redis.set(individualKey, match, config.ttl.cricketFixtures);
                logger.info(`🔄 Updated match ${matchId} status to ${newStatus}`);
            }
        }
    } catch (error) {
        logger.error(`❌ Failed to update match ${matchId} status:`, error);
    }
}

module.exports = processCricketJob;

