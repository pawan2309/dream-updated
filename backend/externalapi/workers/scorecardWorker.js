const logger = require('../utils/logger');
const redis = require('../utils/redis');
const config = require('../../config');

/**
 * Scorecard Worker - Fetches detailed cricket scorecards from external APIs
 * This worker processes jobs from the scorecard-data-queue
 */
async function processScorecardJob(job) {
    try {
        logger.info(`🔄 Processing scorecard job ${job.id} of type ${job.name}`);
        
        const { data } = job;
        const { jobType, eventId, matchId, forceRefresh = false } = data;
        
        let result;
        
        switch (jobType) {
            case 'fetchScorecard':
                if (!eventId) {
                    throw new Error('eventId required for fetchScorecard job');
                }
                result = await fetchScorecard(eventId, forceRefresh);
                break;
                
            case 'fetchBM':
                if (!eventId) {
                    throw new Error('eventId required for fetchBM job');
                }
                result = await fetchBM(eventId, forceRefresh);
                break;
                
            case 'fetchAllScorecards':
                result = await fetchAllScorecards(forceRefresh);
                break;
                
            default:
                throw new Error(`Unknown scorecard job type: ${jobType}`);
        }
        
        logger.info(`✅ Scorecard job ${job.id} completed successfully`);
        return result;
        
    } catch (error) {
        logger.error(`❌ Scorecard job ${job.id} failed:`, error);
        throw error; // Re-throw for BullMQ retry handling
    }
}

/**
 * Fetch detailed scorecard for a specific match
 */
async function fetchScorecard(eventId, forceRefresh = false) {
    try {
        const cacheKey = `scorecard:${eventId}`;
        
        // Check cache first (unless force refresh)
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
        
        // Normalize and cache the data
        const normalized = normalizeScorecard(scorecard, eventId);
        await redis.set(cacheKey, normalized, config.ttl.cricketScorecard);
        
        logger.info(`✅ Fetched and cached scorecard for event ${eventId}`);
        return normalized;
        
    } catch (error) {
        logger.error(`❌ Failed to fetch scorecard for event ${eventId}:`, error);
        throw error;
    }
}

/**
 * Fetch BM (Bookmaker) data for a specific match
 */
async function fetchBM(eventId, forceRefresh = false) {
    try {
        const cacheKey = `bm:${eventId}`;
        
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info(`📋 Returning cached BM data for event ${eventId}`);
                return cached;
            }
        }
        
        logger.info(`🌐 Fetching fresh BM data for event ${eventId}...`);
        
        // Fetch from external API
        const response = await fetch(`${config.api.cricketBM}${eventId}`);
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const bmData = await response.json();
        
        // Cache the BM data
        await redis.set(cacheKey, bmData, config.ttl.cricketScorecard);
        
        logger.info(`✅ Fetched and cached BM data for event ${eventId}`);
        return bmData;
        
    } catch (error) {
        logger.error(`❌ Failed to fetch BM data for event ${eventId}:`, error);
        throw error;
    }
}

/**
 * Fetch all available scorecards
 */
async function fetchAllScorecards(forceRefresh = false) {
    try {
        const cacheKey = 'scorecards:all';
        
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info('📋 Returning cached scorecards data');
                return cached;
            }
        }
        
        logger.info('🌐 Fetching fresh scorecards data...');
        
        // Get list of active matches from fixtures cache
        const fixtures = await redis.get('cricket:fixtures');
        if (!fixtures || !Array.isArray(fixtures)) {
            logger.warn('⚠️ No fixtures available, cannot fetch scorecards');
            return [];
        }
        
        // Fetch scorecards for active matches
        const scorecards = [];
        const activeMatches = fixtures.filter(fixture => 
            fixture.status === 'live' || fixture.status === 'in_progress'
        );
        
        for (const match of activeMatches.slice(0, 10)) { // Limit to 10 concurrent requests
            try {
                const scorecard = await fetchScorecard(match.id, forceRefresh);
                if (scorecard) {
                    scorecards.push(scorecard);
                }
            } catch (error) {
                logger.warn(`⚠️ Failed to fetch scorecard for match ${match.id}:`, error.message);
            }
        }
        
        // Cache all scorecards
        await redis.set(cacheKey, scorecards, config.ttl.cricketScorecard);
        
        logger.info(`✅ Fetched and cached ${scorecards.length} scorecards`);
        return scorecards;
        
    } catch (error) {
        logger.error('❌ Failed to fetch all scorecards:', error);
        throw error;
    }
}

/**
 * Normalize scorecard data structure
 */
function normalizeScorecard(scorecard, eventId) {
    if (!scorecard) {
        return null;
    }
    
    return {
        eventId: eventId,
        matchInfo: {
            name: scorecard.matchName || scorecard.name,
            status: scorecard.status || 'unknown',
            venue: scorecard.venue || '',
            startTime: scorecard.startTime || scorecard.startDate,
            lastUpdated: new Date().toISOString()
        },
        teams: scorecard.teams || scorecard.scores || [],
        innings: scorecard.innings || [],
        summary: {
            totalRuns: scorecard.totalRuns || 0,
            totalWickets: scorecard.totalWickets || 0,
            overs: scorecard.overs || 0,
            runRate: scorecard.runRate || 0
        },
        extras: scorecard.extras || {},
        fallOfWickets: scorecard.fallOfWickets || [],
        partnerships: scorecard.partnerships || [],
        // Add more fields as needed based on your API response
    };
}

async function processCricketScorecards(data) {
    try {
        const { data: scorecards, timestamp } = data;
        
        logger.info(`📊 Processing ${scorecards.length} cricket scorecards`);
        
        for (const scorecard of scorecards) {
            // Cache scorecard in Redis for fast access
            const cacheKey = `scorecard:cricket:${scorecard.matchId}`;
            await redis.set(cacheKey, scorecard, 60); // 1 minute TTL
            
            // Store in PostgreSQL for historical data
            try {
                await database.insert('cricket_scorecards_history', {
                    match_id: scorecard.matchId,
                    score_data: JSON.stringify(scorecard.score),
                    status: scorecard.status,
                    timestamp: scorecard.timestamp,
                    created_at: new Date()
                });
            } catch (dbError) {
                logger.error(`❌ Failed to store cricket scorecard for match ${scorecard.matchId}:`, dbError);
            }
        }
        
        // Cache latest scorecards summary
        await redis.set('scorecard:cricket:latest', scorecards, 30); // 30 seconds TTL
        
        logger.info(`✅ Processed ${scorecards.length} cricket scorecards`);
        return { processed: scorecards.length, timestamp };
        
    } catch (error) {
        logger.error('❌ Failed to process cricket scorecards:', error);
        throw error;
    }
}

async function processScorecardData(data) {
    try {
        const { data: scorecardData, timestamp } = data;
        
        logger.info(`📊 Processing ${scorecardData.length} scorecard data`);
        
        for (const scorecard of scorecardData) {
            // Cache scorecard in Redis for fast access
            const cacheKey = `scorecard:match:${scorecard.matchId}`;
            await redis.set(cacheKey, scorecard, 120); // 2 minutes TTL
            
            // Store in PostgreSQL for historical data
            try {
                await database.insert('scorecards_history', {
                    match_id: scorecard.matchId,
                    innings_data: JSON.stringify(scorecard.innings),
                    timestamp: scorecard.timestamp,
                    created_at: new Date()
                });
            } catch (dbError) {
                logger.error(`❌ Failed to store scorecard for match ${scorecard.matchId}:`, dbError);
            }
        }
        
        // Cache latest scorecards summary
        await redis.set('scorecard:latest', scorecardData, 60); // 1 minute TTL
        
        // Update match statistics
        await updateMatchStatistics(scorecardData);
        
        logger.info(`✅ Processed ${scorecardData.length} scorecard data`);
        return { processed: scorecardData.length, timestamp };
        
    } catch (error) {
        logger.error('❌ Failed to process scorecard data:', error);
        throw error;
    }
}

async function updateMatchStatistics(scorecardData) {
    try {
        // Calculate match statistics
        const matchStats = {};
        
        for (const scorecard of scorecardData) {
            const matchId = scorecard.matchId;
            
            if (!matchStats[matchId]) {
                matchStats[matchId] = {
                    totalRuns: 0,
                    totalWickets: 0,
                    totalOvers: 0,
                    innings: 0
                };
            }
            
            for (const innings of scorecard.innings) {
                matchStats[matchId].totalRuns += innings.score || 0;
                matchStats[matchId].totalWickets += innings.wickets || 0;
                matchStats[matchId].totalOvers += innings.overs || 0;
                matchStats[matchId].innings++;
            }
        }
        
        // Cache match statistics in Redis
        for (const [matchId, stats] of Object.entries(matchStats)) {
            const statsKey = `scorecard:stats:${matchId}`;
            await redis.set(statsKey, stats, 3600); // 1 hour TTL
        }
        
        // Cache overall statistics
        await redis.set('scorecard:stats:overall', matchStats, 3600); // 1 hour TTL
        
        logger.debug('📊 Updated match statistics');
        
    } catch (error) {
        logger.error('❌ Failed to update match statistics:', error);
    }
}

module.exports = processScorecardJob; 