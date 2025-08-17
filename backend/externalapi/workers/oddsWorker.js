const logger = require('../utils/logger');
const redis = require('../utils/redis');
const config = require('../../config');

/**
 * Odds Worker - Fetches betting odds from external APIs
 * This worker processes jobs from the odds-data-queue
 */
async function processOddsJob(job) {
    try {
        logger.info(`🔄 Processing odds job ${job.id} of type ${job.name}`);
        
        const { data } = job;
        const { jobType, matchId, forceRefresh = false } = data;
        
        let result;
        
        switch (jobType) {
            case 'fetchOdds':
                result = await fetchAllOdds(forceRefresh);
                break;
                
            case 'fetchMatchOdds':
                if (!matchId) {
                    throw new Error('matchId required for fetchMatchOdds job');
                }
                result = await fetchMatchOdds(matchId, forceRefresh);
                break;
                
            case 'refreshOdds':
                result = await refreshAllOdds();
                break;
                
            default:
                throw new Error(`Unknown odds job type: ${jobType}`);
        }
        
        logger.info(`✅ Odds job ${job.id} completed successfully`);
        return result;
        
    } catch (error) {
        logger.error(`❌ Odds job ${job.id} failed:`, error);
        throw error; // Re-throw for BullMQ retry handling
    }
}

/**
 * Fetch all odds from external API
 */
async function fetchAllOdds(forceRefresh = false) {
    try {
        const cacheKey = 'odds:all';
        
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info('📋 Returning cached odds data');
                return cached;
            }
        }
        
        logger.info('🌐 Fetching fresh odds data from API...');
        
        // Fetch from external API
        const response = await fetch(config.api.cricketOddsFeed);
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const odds = await response.json();
        
        // Normalize and cache the data
        const normalized = normalizeOdds(odds);
        await redis.set(cacheKey, normalized, config.ttl.cricketOdds);
        
        // Also cache individual match odds for quick access
        await cacheIndividualMatchOdds(normalized);
        
        logger.info(`✅ Fetched and cached odds for ${normalized.length} matches`);
        return normalized;
        
    } catch (error) {
        logger.error('❌ Failed to fetch odds data:', error);
        throw error;
    }
}

/**
 * Fetch odds for a specific match
 */
async function fetchMatchOdds(matchId, forceRefresh = false) {
    try {
        const cacheKey = `odds:match:${matchId}`;
        
        // Check cache first
        if (!forceRefresh) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info(`📋 Returning cached odds for match ${matchId}`);
                return cached;
            }
        }
        
        logger.info(`🌐 Fetching fresh odds for match ${matchId}...`);
        
        // Try to get from the main odds cache first
        const allOdds = await redis.get('odds:all');
        if (allOdds) {
            const matchOdds = allOdds.find(odd => odd.matchId === matchId);
            if (matchOdds) {
                await redis.set(cacheKey, matchOdds, config.ttl.cricketOdds);
                return matchOdds;
            }
        }
        
        // If not found, fetch from API (you might need to adjust this URL)
        const response = await fetch(`${config.api.cricketOddsFeed}?matchId=${matchId}`);
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const matchOdds = await response.json();
        
        // Cache the match odds
        await redis.set(cacheKey, matchOdds, config.ttl.cricketOdds);
        
        logger.info(`✅ Fetched and cached odds for match ${matchId}`);
        return matchOdds;
        
    } catch (error) {
        logger.error(`❌ Failed to fetch odds for match ${matchId}:`, error);
        throw error;
    }
}

/**
 * Refresh all odds (force refresh)
 */
async function refreshAllOdds() {
    try {
        logger.info('🔄 Refreshing all odds data...');
        
        // Clear odds cache
        await redis.del('odds:all');
        
        // Fetch fresh data
        const result = await fetchAllOdds(true);
        
        logger.info('✅ All odds refreshed successfully');
        return result;
        
    } catch (error) {
        logger.error('❌ Failed to refresh odds:', error);
        throw error;
    }
}

/**
 * Cache individual match odds for quick access
 */
async function cacheIndividualMatchOdds(allOdds) {
    try {
        for (const matchOdds of allOdds) {
            if (matchOdds.matchId) {
                const cacheKey = `odds:match:${matchOdds.matchId}`;
                await redis.set(cacheKey, matchOdds, config.ttl.cricketOdds);
            }
        }
        logger.debug(`📝 Cached individual odds for ${allOdds.length} matches`);
    } catch (error) {
        logger.error('❌ Failed to cache individual match odds:', error);
    }
}

/**
 * Normalize odds data structure
 */
function normalizeOdds(odds) {
    if (!Array.isArray(odds)) {
        return [];
    }
    
    return odds.map(odd => ({
        matchId: odd.matchId || odd.id,
        matchName: odd.matchName || odd.name,
        team1: odd.team1 || odd.homeTeam,
        team2: odd.team2 || odd.awayTeam,
        startTime: odd.startTime || odd.startDate,
        status: odd.status || 'scheduled',
        odds: {
            team1Win: odd.odds?.team1Win || odd.odds?.home || 0,
            team2Win: odd.odds?.team2Win || odd.odds?.away || 0,
            draw: odd.odds?.draw || 0,
            // Add more odds types as needed
        },
        lastUpdated: new Date().toISOString()
    }));
}

module.exports = processOddsJob; 