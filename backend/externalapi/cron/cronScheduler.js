const cron = require('node-cron');
const logger = require('../utils/logger');
const { addJob } = require('../queues/queue');
const { addFetchFixturesJob, addFetchCricketOddsJob, addFetchCricketScorecardsJob } = require('../queues/cricketQueue');
const { addFetchCasinoResultsJob } = require('../queues/casinoQueue');
const { enqueueRefreshForFixtures } = require('./refreshOddsForFixtures');
const { cleanupStaleRedisKeys, cleanupCompletedMatches } = require('./cleanupStaleRedisKeys');
const apiFetcher = require('../utils/apiFetcher');

class CronScheduler {
    constructor() {
        this.tasks = new Map();
        this.isRunning = false;
    }

    async initialize() {
        try {
            logger.info('📅 Initializing Cron Scheduler...');
            await this.scheduleAllJobs();
            this.isRunning = true;
            logger.info('✅ Cron Scheduler initialized successfully');
        } catch (error) {
            logger.error('❌ Failed to initialize Cron Scheduler:', error);
            throw error;
        }
    }

    async scheduleAllJobs() {
        this.scheduleCricketJobs();
        this.scheduleCasinoJobs();
        this.scheduleOddsRefreshJobs();
        this.scheduleCleanupJobs();
    }

    scheduleCricketJobs() {
        // More frequent updates for live data
        this.scheduleTask('cricket-fixtures-enqueue', '*/2 * * * *', async () => {
            try {
                logger.info('Enqueueing fetch-fixtures job');
                await addFetchFixturesJob();
            } catch (error) {
                logger.error('❌ Failed to enqueue fetch-fixtures:', error);
            }
        });

        // Every 10 seconds per spec
        this.scheduleTask('cricket-odds-enqueue', '*/10 * * * * *', async () => {
            try {
                logger.info('Enqueueing fetch-cricket-odds job');
                await addFetchCricketOddsJob();
            } catch (error) {
                logger.error('❌ Failed to enqueue fetch-cricket-odds:', error);
            }
        });

        // Every 1 minute: scorecards
        this.scheduleTask('cricket-scorecards-enqueue', '*/1 * * * *', async () => {
            try {
                logger.info('Enqueueing fetch-cricket-scorecards job');
                await addFetchCricketScorecardsJob();
            } catch (error) {
                logger.error('❌ Failed to enqueue fetch-cricket-scorecards:', error);
            }
        });
    }

    scheduleCasinoJobs() {
        // Every 10 seconds: casino results
        this.scheduleTask('casino-results-enqueue', '*/10 * * * * *', async () => {
            try {
                logger.info('Enqueueing fetch-casino-results job');
                await addFetchCasinoResultsJob();
            } catch (error) {
                logger.error('❌ Failed to enqueue fetch-casino-results:', error);
            }
        });

        // Every 5 minutes: sync casino data from external APIs
        this.scheduleTask('casino-data-sync', '*/5 * * * *', async () => {
            try {
                logger.info('🔄 Auto-syncing casino data from external APIs...');
                const casinoService = require('../../services/casinoService');
                
                // Ensure table exists
                await casinoService.ensureTable();
                
                // Fetch from external APIs and sync to DB
                const CASINO_ENDPOINTS = {
                    teen20: { name: 'Teen20', streamingId: '3030', dataUrl: 'http://159.65.20.25:3000/getdata/teen20', resultUrl: 'http://159.65.20.25:3000/getresult/teen20' },
                    ab20: { name: 'AB20', streamingId: '3043', dataUrl: 'http://159.65.20.25:3000/getdata/ab20', resultUrl: 'http://159.65.20.25:3000/getresult/ab20' },
                    dt20: { name: 'DT20', streamingId: '3035', dataUrl: 'http://159.65.20.25:3000/getdata/dt20', resultUrl: 'http://159.65.20.25:3000/getresult/dt20' },
                    aaa: { name: 'AAA', streamingId: '3056', dataUrl: 'http://159.65.20.25:3000/getdata/aaa', resultUrl: 'http://159.65.20.25:3000/getresult/aaa' },
                    card32eu: { name: 'Card32EU', streamingId: '3034', dataUrl: 'http://159.65.20.25:3000/getdata/card32eu', resultUrl: 'http://159.65.20.25:3000/getresult/card32eu' },
                    lucky7eu: { name: 'Lucky7EU', streamingId: '3032', dataUrl: 'http://159.65.20.25:3000/getdata/lucky7eu', resultUrl: 'http://159.65.20.25:3000/getresult/lucky7eu' }
                };

                const casinoData = [];
                for (const [key, casino] of Object.entries(CASINO_ENDPOINTS)) {
                    try {
                        const dataResponse = await fetch(casino.dataUrl, {
                            method: 'GET',
                            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                        });
                        
                        if (dataResponse.ok) {
                            const data = await dataResponse.json();
                            casinoData.push({
                                eventId: casino.streamingId,
                                name: casino.name,
                                shortName: key.toUpperCase(),
                                betStatus: data.status || 'yes',
                                minStake: data.minStake || 100,
                                maxStake: data.maxStake || 10000,
                                streamingId: casino.streamingId,
                                dataUrl: casino.dataUrl,
                                resultUrl: casino.resultUrl
                            });
                        }
                    } catch (error) {
                        logger.error(`Error fetching casino ${key}:`, error);
                    }
                }

                if (casinoData.length > 0) {
                    await casinoService.syncCasinosFromExternalAPI(casinoData);
                    logger.info(`✅ Auto-synced ${casinoData.length} casino games to database`);
                }
            } catch (error) {
                logger.error('❌ Failed to auto-sync casino data:', error);
            }
        });
    }

    scheduleOddsRefreshJobs() {
        // Every 3 seconds: enqueue per-fixture BM odds refresh jobs
        this.scheduleTask('cricket-odds-refresh-for-fixtures', '*/3 * * * * *', async () => {
            try {
                const { enqueued } = await enqueueRefreshForFixtures();
                logger.info(`cricket-odds-refresh-for-fixtures tick: enqueued=${enqueued}`);
            } catch (error) {
                logger.error('❌ refreshOddsForFixtures enqueue error:', error);
            }
        });
    }

    scheduleCleanupJobs() {
        // Every 5 minutes: cleanup stale Redis keys
        this.scheduleTask('cleanup-stale-redis-keys', '*/5 * * * *', async () => {
            try {
                await cleanupStaleRedisKeys();
            } catch (error) {
                logger.error('❌ cleanupStaleRedisKeys error:', error);
            }
        });
        
        // Every 10 minutes: cleanup completed matches
        this.scheduleTask('cleanup-completed-matches', '*/10 * * * *', async () => {
            try {
                await cleanupCompletedMatches();
            } catch (error) {
                logger.error('❌ cleanupCompletedMatches error:', error);
            }
        });
    }

    scheduleTask(name, schedule, task) {
        try {
            if (this.tasks.has(name)) {
                this.tasks.get(name).stop();
            }
            const cronTask = cron.schedule(schedule, task, { scheduled: false, timezone: 'UTC' });
            this.tasks.set(name, cronTask);
            cronTask.start();
            logger.info(`📅 Scheduled task: ${name} (${schedule})`);
        } catch (error) {
            logger.error(`❌ Failed to schedule task ${name}:`, error);
        }
    }

    stopTask(name) {
        try {
            if (this.tasks.has(name)) {
                this.tasks.get(name).stop();
                this.tasks.delete(name);
                logger.info(`🛑 Stopped task: ${name}`);
            }
        } catch (error) {
            logger.error(`❌ Failed to stop task ${name}:`, error);
        }
    }

    stopAllTasks() {
        try {
            for (const [name, task] of this.tasks) {
                task.stop();
                logger.info(`🛑 Stopped task: ${name}`);
            }
            this.tasks.clear();
            this.isRunning = false;
        } catch (error) {
            logger.error('❌ Failed to stop all tasks:', error);
        }
    }

    getTaskStatus() {
        const status = {};
        for (const [name, task] of this.tasks) {
            status[name] = { running: task.running, scheduled: task.scheduled };
        }
        return status;
    }
}

const cronScheduler = new CronScheduler();

async function initialize() { return cronScheduler.initialize(); }
function scheduleTask(name, schedule, task) { return cronScheduler.scheduleTask(name, schedule, task); }
function stopTask(name) { return cronScheduler.stopTask(name); }
function stopAllTasks() { return cronScheduler.stopAllTasks(); }
function getTaskStatus() { return cronScheduler.getTaskStatus(); }

module.exports = { initialize, scheduleTask, stopTask, stopAllTasks, getTaskStatus, cronScheduler }; 