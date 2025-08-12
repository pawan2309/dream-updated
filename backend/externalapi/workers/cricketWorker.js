const logger = require('../utils/logger');
const redis = require('../utils/redis');
const database = require('../utils/database');
const { fetchAndStoreFixtures } = require('../jobs/fetchFixtures');
const { fetchAndStoreOdds } = require('../jobs/fetchOdds');
const { fetchCricketOdds } = require('../jobs/fetchCricketOdds');
const { fetchCricketScorecards } = require('../jobs/fetchCricketScorecards');

async function cricketWorker(job) {
    const { name, data } = job;
    
    try {
        logger.info(`👷 Processing cricket job: ${name} (ID: ${job.id})`);
        
        switch (name) {
            case 'fetch-fixtures':
                return await fetchAndStoreFixtures();
            case 'fetch-cricket-odds':
                return await fetchCricketOdds();
            case 'fetch-cricket-scorecards':
                return await fetchCricketScorecards();
            case 'process-fixtures':
                return await processFixtures(data);
            case 'process-cricket-odds':
                return await processCricketOdds(data);
            case 'process-cricket-scorecards':
                return await processCricketScorecards(data);
            case 'process-health-check':
                return await processHealthCheck(data);
            default:
                throw new Error(`Unknown cricket job type: ${name}`);
        }
        
    } catch (error) {
        logger.error(`❌ Cricket worker failed for job ${job.id}:`, error);
        throw error;
    }
}

async function processFixtures(data) {
    try {
        const { data: fixtures, timestamp } = data;
        
        logger.info(`📊 Processing ${fixtures.length} cricket fixtures`);
        
        // Cache fixtures in Redis for fast access
        await redis.set('cricket:fixtures', fixtures, 300); // 5 minutes TTL
        
        // Store in PostgreSQL for persistence
        for (const fixture of fixtures) {
            try {
                // Check if fixture already exists
                const existing = await database.findOne('cricket_fixtures', { 
                    external_id: fixture.id 
                });
                
                if (existing) {
                    // Update existing fixture
                    await database.update('cricket_fixtures', 
                        {
                            team1: fixture.team1,
                            team2: fixture.team2,
                            start_time: fixture.startTime,
                            status: fixture.status,
                            updated_at: new Date()
                        },
                        { external_id: fixture.id }
                    );
                } else {
                    // Insert new fixture
                    await database.insert('cricket_fixtures', {
                        external_id: fixture.id,
                        team1: fixture.team1,
                        team2: fixture.team2,
                        start_time: fixture.startTime,
                        status: fixture.status,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            } catch (dbError) {
                logger.error(`❌ Failed to store fixture ${fixture.id}:`, dbError);
            }
        }
        
        // Emit to Socket.IO for real-time updates
        // This would be handled by the main application
        
        logger.info(`✅ Processed ${fixtures.length} cricket fixtures`);
        return { processed: fixtures.length, timestamp };
        
    } catch (error) {
        logger.error('❌ Failed to process fixtures:', error);
        throw error;
    }
}

async function processCricketOdds(data) {
    try {
        const { data: odds, timestamp } = data;
        
        logger.info(`📊 Processing ${odds.length} cricket odds`);
        
        for (const odd of odds) {
            // Cache odds in Redis for fast access
            const cacheKey = `cricket:odds:${odd.matchId}`;
            await redis.set(cacheKey, odd, 60); // 1 minute TTL
            
            // Store in PostgreSQL for historical data
            try {
                await database.insert('cricket_odds', {
                    match_id: odd.matchId,
                    odds_data: JSON.stringify(odd.odds),
                    timestamp: odd.timestamp,
                    created_at: new Date()
                });
            } catch (dbError) {
                logger.error(`❌ Failed to store odds for match ${odd.matchId}:`, dbError);
            }
        }
        
        // Cache latest odds summary
        await redis.set('cricket:odds:latest', odds, 30); // 30 seconds TTL
        
        logger.info(`✅ Processed ${odds.length} cricket odds`);
        return { processed: odds.length, timestamp };
        
    } catch (error) {
        logger.error('❌ Failed to process cricket odds:', error);
        throw error;
    }
}

async function processCricketScorecards(data) {
    try {
        const { data: scorecards, timestamp } = data;
        
        logger.info(`📊 Processing ${scorecards.length} cricket scorecards`);
        
        for (const scorecard of scorecards) {
            // Cache scorecard in Redis for fast access
            const cacheKey = `cricket:scorecard:${scorecard.matchId}`;
            await redis.set(cacheKey, scorecard, 120); // 2 minutes TTL
            
            // Store in PostgreSQL for historical data
            try {
                await database.insert('cricket_scorecards', {
                    match_id: scorecard.matchId,
                    score_data: JSON.stringify(scorecard.score),
                    status: scorecard.status,
                    timestamp: scorecard.timestamp,
                    created_at: new Date()
                });
            } catch (dbError) {
                logger.error(`❌ Failed to store scorecard for match ${scorecard.matchId}:`, dbError);
            }
        }
        
        // Cache latest scorecards summary
        await redis.set('cricket:scorecards:latest', scorecards, 60); // 1 minute TTL
        
        logger.info(`✅ Processed ${scorecards.length} cricket scorecards`);
        return { processed: scorecards.length, timestamp };
        
    } catch (error) {
        logger.error('❌ Failed to process cricket scorecards:', error);
        throw error;
    }
}

async function processHealthCheck(data) {
    try {
        const { data: healthStatus, timestamp } = data;
        
        logger.info('📊 Processing health check data');
        
        // Cache health status
        await redis.set('system:health', healthStatus, 300); // 5 minutes TTL
        
        // Store in PostgreSQL for monitoring
        try {
            await database.insert('system_health_logs', {
                status: healthStatus.status,
                services: JSON.stringify(healthStatus.services),
                timestamp: healthStatus.timestamp,
                created_at: new Date()
            });
        } catch (dbError) {
            logger.error('❌ Failed to store health check data:', dbError);
        }
        
        logger.info('✅ Processed health check data');
        return { processed: true, timestamp };
        
    } catch (error) {
        logger.error('❌ Failed to process health check:', error);
        throw error;
    }
}

module.exports = cricketWorker; 