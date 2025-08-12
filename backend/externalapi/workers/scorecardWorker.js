const logger = require('../utils/logger');
const redis = require('../utils/redis');
const database = require('../utils/database');

async function scorecardWorker(job) {
    const { name, data } = job;
    
    try {
        logger.info(`👷 Processing scorecard job: ${name} (ID: ${job.id})`);
        
        switch (name) {
            case 'process-cricket-scorecards':
                return await processCricketScorecards(data);
            
            case 'process-scorecard-data':
                return await processScorecardData(data);
            
            default:
                throw new Error(`Unknown scorecard job type: ${name}`);
        }
        
    } catch (error) {
        logger.error(`❌ Scorecard worker failed for job ${job.id}:`, error);
        throw error;
    }
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

module.exports = scorecardWorker; 