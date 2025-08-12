const logger = require('../utils/logger');
const redis = require('../utils/redis');
const database = require('../utils/database');
const { fetchCasinoResults } = require('../jobs/fetchCasinoResults');

async function casinoWorker(job) {
    const { name, data } = job;
    
    try {
        logger.info(`👷 Processing casino job: ${name} (ID: ${job.id})`);
        
        switch (name) {
            case 'fetch-casino-results':
                return await fetchCasinoResults();
            case 'process-casino-data':
                return await processCasinoData(data);
            
            case 'process-casino-results':
                return await processCasinoResults(data);
            
            default:
                throw new Error(`Unknown casino job type: ${name}`);
        }
        
    } catch (error) {
        logger.error(`❌ Casino worker failed for job ${job.id}:`, error);
        throw error;
    }
}

async function processCasinoData(data) {
    try {
        const { data: casinoData, timestamp } = data;
        
        logger.info(`📊 Processing ${casinoData.length} casino games`);
        
        for (const game of casinoData) {
            // Cache game data in Redis for fast access
            const cacheKey = `casino:game:${game.gameId}`;
            await redis.set(cacheKey, game, 30); // 30 seconds TTL
            
            // Store in PostgreSQL for persistence
            try {
                // Check if game already exists
                const existing = await database.findOne('casino_games', { 
                    game_id: game.gameId 
                });
                
                if (existing) {
                    // Update existing game
                    await database.update('casino_games', 
                        {
                            type: game.type,
                            status: game.status,
                            current_round: game.currentRound,
                            updated_at: new Date()
                        },
                        { game_id: game.gameId }
                    );
                } else {
                    // Insert new game
                    await database.insert('casino_games', {
                        game_id: game.gameId,
                        type: game.type,
                        status: game.status,
                        current_round: game.currentRound,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            } catch (dbError) {
                logger.error(`❌ Failed to store casino game ${game.gameId}:`, dbError);
            }
        }
        
        // Cache active games summary
        const activeGames = casinoData.filter(game => game.status === 'active');
        await redis.set('casino:active-games', activeGames, 15); // 15 seconds TTL
        
        // Cache all games summary
        await redis.set('casino:all-games', casinoData, 30); // 30 seconds TTL
        
        logger.info(`✅ Processed ${casinoData.length} casino games`);
        return { processed: casinoData.length, timestamp };
        
    } catch (error) {
        logger.error('❌ Failed to process casino data:', error);
        throw error;
    }
}

async function processCasinoResults(data) {
    try {
        const { data: results, timestamp } = data;
        
        logger.info(`📊 Processing ${results.length} casino results`);
        
        for (const result of results) {
            // Cache result in Redis for fast access
            const cacheKey = `casino:result:${result.roundId}`;
            await redis.set(cacheKey, result, 300); // 5 minutes TTL
            
            // Store in PostgreSQL for historical data
            try {
                await database.insert('casino_results', {
                    game_id: result.gameId,
                    round_id: result.roundId,
                    result: result.result,
                    timestamp: result.timestamp,
                    created_at: new Date()
                });
            } catch (dbError) {
                logger.error(`❌ Failed to store casino result ${result.roundId}:`, dbError);
            }
        }
        
        // Cache latest results summary
        await redis.set('casino:latest-results', results, 60); // 1 minute TTL
        
        // Update game statistics in Redis
        await updateGameStatistics(results);
        
        logger.info(`✅ Processed ${results.length} casino results`);
        return { processed: results.length, timestamp };
        
    } catch (error) {
        logger.error('❌ Failed to process casino results:', error);
        throw error;
    }
}

async function updateGameStatistics(results) {
    try {
        // Group results by game type
        const gameStats = {};
        
        for (const result of results) {
            const gameType = result.gameId.split('-')[0]; // Extract game type from gameId
            
            if (!gameStats[gameType]) {
                gameStats[gameType] = {
                    total: 0,
                    red: 0,
                    green: 0,
                    violet: 0
                };
            }
            
            gameStats[gameType].total++;
            
            switch (result.result.toLowerCase()) {
                case 'red':
                    gameStats[gameType].red++;
                    break;
                case 'green':
                    gameStats[gameType].green++;
                    break;
                case 'violet':
                    gameStats[gameType].violet++;
                    break;
            }
        }
        
        // Cache statistics in Redis
        for (const [gameType, stats] of Object.entries(gameStats)) {
            const statsKey = `casino:stats:${gameType}`;
            await redis.set(statsKey, stats, 3600); // 1 hour TTL
        }
        
        // Cache overall statistics
        await redis.set('casino:stats:overall', gameStats, 3600); // 1 hour TTL
        
        logger.debug('📊 Updated casino game statistics');
        
    } catch (error) {
        logger.error('❌ Failed to update game statistics:', error);
    }
}

module.exports = casinoWorker; 