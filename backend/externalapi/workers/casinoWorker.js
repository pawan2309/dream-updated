const logger = require('../utils/logger');
const redis = require('../utils/redis');
const config = require('../../config');

/**
 * Casino Worker - Fetches casino results from external APIs
 * This worker processes jobs from the casino-data-queue
 */
async function processCasinoJob(job) {
    try {
        logger.info(`🔄 Processing casino job ${job.id} of type ${job.name}`);
        
        const { data } = job;
        const { gameId, forceRefresh = false } = data;
        const jobType = job.name; // Use job name instead of data.jobType
        
        let result;
        
        switch (jobType) {
            case 'fetch-casino-results':
                result = await fetchCasinoResults(forceRefresh);
                break;
                
            case 'fetchGameResult':
                if (!gameId) {
                    throw new Error('gameId required for fetchGameResult job');
                }
                result = await fetchGameResult(gameId, forceRefresh);
                break;
                
            default:
                throw new Error(`Unknown casino job type: ${jobType}`);
        }
        
        logger.info(`✅ Casino job ${job.id} completed successfully`);
        return result;
        
    } catch (error) {
        logger.error(`❌ Casino job ${job.id} failed:`, error);
        throw error; // Re-throw for BullMQ retry handling
    }
}

/**
 * Fetch casino results from external API
 */
async function fetchCasinoResults(forceRefresh = false) {
    try {
        const cacheKey = 'casino:results';
        
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info('📋 Returning cached casino results');
                return cached;
            }
        }
        
        logger.info('🌐 Fetching fresh casino results from API...');
        
        // Fetch from external API
        const response = await fetch(config.api.casinoResults);
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const results = await response.json();
        
        // Normalize and cache the data
        const normalized = normalizeCasinoResults(results);
        await redis.set(cacheKey, normalized, config.ttl.casinoResult);
        
        logger.info(`✅ Fetched and cached ${normalized.length} casino results`);
        return normalized;
        
    } catch (error) {
        logger.error('❌ Failed to fetch casino results:', error);
        throw error;
    }
}

/**
 * Fetch result for a specific casino game
 */
async function fetchGameResult(gameId, forceRefresh = false) {
    try {
        const cacheKey = `casino:game:${gameId}`;
        
        // Check cache first
        if (!forceRefresh) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info(`📋 Returning cached result for game ${gameId}`);
                return cached;
            }
        }
        
        logger.info(`🌐 Fetching fresh result for game ${gameId}...`);
        
        // Fetch from external API (you might need to adjust this URL)
        const response = await fetch(`${config.api.casinoResults}?gameId=${gameId}`);
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const gameResult = await response.json();
        
        // Cache the game result
        await redis.set(cacheKey, gameResult, config.ttl.casinoResult);
        
        logger.info(`✅ Fetched and cached result for game ${gameId}`);
        return gameResult;
        
    } catch (error) {
        logger.error(`❌ Failed to fetch result for game ${gameId}:`, error);
        throw error;
    }
}

/**
 * Normalize casino results data structure
 */
function normalizeCasinoResults(results) {
    if (!Array.isArray(results)) {
        return [];
    }
    
    return results.map(result => ({
        id: result.id || result.gameId,
        gameType: result.gameType || result.type,
        result: result.result || result.outcome,
        timestamp: result.timestamp || result.time,
        gameName: result.gameName || result.name,
        lastUpdated: new Date().toISOString()
    }));
}

module.exports = processCasinoJob; 