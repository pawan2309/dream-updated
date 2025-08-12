const logger = require('../utils/logger');
const redis = require('../utils/redis');
const database = require('../utils/database');

async function oddsWorker(job) {
    const { name, data } = job;
    
    try {
        logger.info(`👷 Processing odds job: ${name} (ID: ${job.id})`);
        
        switch (name) {
            case 'process-cricket-odds':
                return await processCricketOdds(data);
            
            case 'process-odds-data':
                return await processOddsData(data);
            
            default:
                throw new Error(`Unknown odds job type: ${name}`);
        }
        
    } catch (error) {
        logger.error(`❌ Odds worker failed for job ${job.id}:`, error);
        throw error;
    }
}

async function processCricketOdds(data) {
    try {
        const { data: odds, timestamp } = data;
        
        logger.info(`📊 Processing ${odds.length} cricket odds`);
        
        for (const odd of odds) {
            // Cache odds in Redis for fast access
            const cacheKey = `odds:cricket:${odd.matchId}`;
            await redis.set(cacheKey, odd, 30); // 30 seconds TTL
            
            // Store in PostgreSQL for historical data
            try {
                await database.insert('cricket_odds_history', {
                    match_id: odd.matchId,
                    odds_data: JSON.stringify(odd.odds),
                    timestamp: odd.timestamp,
                    created_at: new Date()
                });
            } catch (dbError) {
                logger.error(`❌ Failed to store cricket odds for match ${odd.matchId}:`, dbError);
            }
        }
        
        // Cache latest odds summary
        await redis.set('odds:cricket:latest', odds, 15); // 15 seconds TTL
        
        logger.info(`✅ Processed ${odds.length} cricket odds`);
        return { processed: odds.length, timestamp };
        
    } catch (error) {
        logger.error('❌ Failed to process cricket odds:', error);
        throw error;
    }
}

async function processOddsData(data) {
    try {
        const { data: oddsData, timestamp } = data;
        
        logger.info(`📊 Processing ${oddsData.length} odds data`);
        
        for (const odd of oddsData) {
            // Cache odds in Redis for fast access
            const cacheKey = `odds:event:${odd.eventId}`;
            await redis.set(cacheKey, odd, 30); // 30 seconds TTL
            
            // Store in PostgreSQL for historical data
            try {
                await database.insert('odds_history', {
                    event_id: odd.eventId,
                    odds_data: JSON.stringify(odd.odds),
                    timestamp: odd.timestamp,
                    created_at: new Date()
                });
            } catch (dbError) {
                logger.error(`❌ Failed to store odds for event ${odd.eventId}:`, dbError);
            }
        }
        
        // Cache latest odds summary
        await redis.set('odds:latest', oddsData, 15); // 15 seconds TTL
        
        // Update odds statistics
        await updateOddsStatistics(oddsData);
        
        logger.info(`✅ Processed ${oddsData.length} odds data`);
        return { processed: oddsData.length, timestamp };
        
    } catch (error) {
        logger.error('❌ Failed to process odds data:', error);
        throw error;
    }
}

async function updateOddsStatistics(oddsData) {
    try {
        // Calculate average odds for different markets
        const marketStats = {};
        
        for (const odd of oddsData) {
            const odds = odd.odds;
            
            // Process different types of odds
            if (odds.home && odds.away) {
                if (!marketStats.matchWinner) {
                    marketStats.matchWinner = {
                        total: 0,
                        homeAvg: 0,
                        awayAvg: 0,
                        homeTotal: 0,
                        awayTotal: 0
                    };
                }
                
                marketStats.matchWinner.total++;
                marketStats.matchWinner.homeTotal += odds.home;
                marketStats.matchWinner.awayTotal += odds.away;
                marketStats.matchWinner.homeAvg = marketStats.matchWinner.homeTotal / marketStats.matchWinner.total;
                marketStats.matchWinner.awayAvg = marketStats.matchWinner.awayTotal / marketStats.matchWinner.total;
            }
            
            if (odds.team1 && odds.team2 && odds.draw) {
                if (!marketStats.threeWay) {
                    marketStats.threeWay = {
                        total: 0,
                        team1Avg: 0,
                        team2Avg: 0,
                        drawAvg: 0,
                        team1Total: 0,
                        team2Total: 0,
                        drawTotal: 0
                    };
                }
                
                marketStats.threeWay.total++;
                marketStats.threeWay.team1Total += odds.team1;
                marketStats.threeWay.team2Total += odds.team2;
                marketStats.threeWay.drawTotal += odds.draw;
                marketStats.threeWay.team1Avg = marketStats.threeWay.team1Total / marketStats.threeWay.total;
                marketStats.threeWay.team2Avg = marketStats.threeWay.team2Total / marketStats.threeWay.total;
                marketStats.threeWay.drawAvg = marketStats.threeWay.drawTotal / marketStats.threeWay.total;
            }
        }
        
        // Cache statistics in Redis
        await redis.set('odds:statistics', marketStats, 3600); // 1 hour TTL
        
        logger.debug('📊 Updated odds statistics');
        
    } catch (error) {
        logger.error('❌ Failed to update odds statistics:', error);
    }
}

module.exports = oddsWorker; 