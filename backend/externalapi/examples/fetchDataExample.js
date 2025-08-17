const { addJob, initializeQueues } = require('../queues/queue');
const logger = require('../utils/logger');

/**
 * Example: How to use the queue system to fetch data
 * This demonstrates the complete flow from adding jobs to processing them
 */

async function exampleFetchData() {
    try {
        // 1. Initialize the queue system
        logger.info('🚀 Initializing queue system...');
        await initializeQueues();
        logger.info('✅ Queue system initialized');
        
        // 2. Add jobs to fetch different types of data
        
        // Fetch cricket fixtures
        logger.info('📝 Adding cricket fixtures job...');
        const fixturesJob = await addJob('cricket', 'fetchFixtures', {
            jobType: 'fetchFixtures',
            forceRefresh: false
        });
        logger.info(`✅ Added fixtures job: ${fixturesJob.id}`);
        
        // Fetch cricket odds
        logger.info('📝 Adding cricket odds job...');
        const oddsJob = await addJob('odds', 'fetchOdds', {
            jobType: 'fetchOdds',
            forceRefresh: false
        });
        logger.info(`✅ Added odds job: ${oddsJob.id}`);
        
        // Fetch casino results
        logger.info('📝 Adding casino results job...');
        const casinoJob = await addJob('casino', 'fetchResults', {
            jobType: 'fetchResults',
            forceRefresh: false
        });
        logger.info(`✅ Added casino job: ${casinoJob.id}`);
        
        // Fetch specific match scorecard
        logger.info('📝 Adding scorecard job...');
        const scorecardJob = await addJob('scorecard', 'fetchScorecard', {
            jobType: 'fetchScorecard',
            eventId: '12345',
            forceRefresh: false
        });
        logger.info(`✅ Added scorecard job: ${scorecardJob.id}`);
        
        logger.info('🎯 All data fetch jobs added successfully!');
        logger.info('📊 Workers will process these jobs automatically');
        
        return {
            fixturesJob: fixturesJob.id,
            oddsJob: oddsJob.id,
            casinoJob: casinoJob.id,
            scorecardJob: scorecardJob.id
        };
        
    } catch (error) {
        logger.error('❌ Failed to add data fetch jobs:', error);
        throw error;
    }
}

/**
 * Example: Fetch data for a specific match
 */
async function fetchMatchData(matchId) {
    try {
        logger.info(`🎯 Fetching data for match: ${matchId}`);
        
        // Add multiple jobs for comprehensive match data
        const jobs = await Promise.all([
            // Fetch match scorecard
            addJob('scorecard', 'fetchScorecard', {
                jobType: 'fetchScorecard',
                eventId: matchId,
                forceRefresh: true
            }),
            
            // Fetch match odds
            addJob('odds', 'fetchMatchOdds', {
                jobType: 'fetchMatchOdds',
                matchId: matchId,
                forceRefresh: true
            }),
            
            // Fetch BM data
            addJob('scorecard', 'fetchBM', {
                jobType: 'fetchBM',
                eventId: matchId,
                forceRefresh: true
            })
        ]);
        
        logger.info(`✅ Added ${jobs.length} jobs for match ${matchId}`);
        return jobs.map(job => job.id);
        
    } catch (error) {
        logger.error(`❌ Failed to add match data jobs for ${matchId}:`, error);
        throw error;
    }
}

/**
 * Example: Force refresh all data
 */
async function refreshAllData() {
    try {
        logger.info('🔄 Force refreshing all data...');
        
        const jobs = await Promise.all([
            // Refresh fixtures
            addJob('cricket', 'fetchFixtures', {
                jobType: 'fetchFixtures',
                forceRefresh: true
            }),
            
            // Refresh odds
            addJob('odds', 'refreshOdds', {
                jobType: 'refreshOdds'
            }),
            
            // Refresh casino results
            addJob('casino', 'fetchResults', {
                jobType: 'fetchResults',
                forceRefresh: true
            }),
            
            // Refresh all scorecards
            addJob('scorecard', 'fetchAllScorecards', {
                jobType: 'fetchAllScorecards',
                forceRefresh: true
            })
        ]);
        
        logger.info(`✅ Added ${jobs.length} refresh jobs`);
        return jobs.map(job => job.id);
        
    } catch (error) {
        logger.error('❌ Failed to add refresh jobs:', error);
        throw error;
    }
}

/**
 * Example: Scheduled data fetching
 */
async function scheduleDataFetching() {
    try {
        logger.info('⏰ Setting up scheduled data fetching...');
        
        // This would typically be done with a cron job or scheduler
        // For now, we'll just add jobs that will be processed immediately
        
        // Fetch fixtures every 5 minutes (when TTL expires)
        await addJob('cricket', 'fetchFixtures', {
            jobType: 'fetchFixtures',
            forceRefresh: false
        });
        
        // Fetch odds every 30 seconds (when TTL expires)
        await addJob('odds', 'fetchOdds', {
            jobType: 'fetchOdds',
            forceRefresh: false
        });
        
        // Fetch casino results every minute (when TTL expires)
        await addJob('casino', 'fetchResults', {
            jobType: 'fetchResults',
            forceRefresh: false
        });
        
        logger.info('✅ Scheduled data fetching jobs added');
        
    } catch (error) {
        logger.error('❌ Failed to schedule data fetching:', error);
        throw error;
    }
}

// Export functions for use in other parts of the application
module.exports = {
    exampleFetchData,
    fetchMatchData,
    refreshAllData,
    scheduleDataFetching
};

// Example usage (uncomment to test)
/*
if (require.main === module) {
    exampleFetchData()
        .then(result => {
            console.log('✅ Example completed:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Example failed:', error);
            process.exit(1);
        });
}
*/
