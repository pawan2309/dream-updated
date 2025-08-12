const cron = require('node-cron');
const logger = require('../utils/logger');
const { addJob } = require('../queues/queue');
const { addFetchFixturesJob, addFetchCricketOddsJob, addFetchCricketScorecardsJob } = require('../queues/cricketQueue');
const { addFetchCasinoResultsJob } = require('../queues/casinoQueue');
const { enqueueRefreshForFixtures } = require('./refreshOddsForFixtures');
const { cleanupStaleRedisKeys } = require('./cleanupStaleRedisKeys');
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
        this.scheduleTask('cricket-fixtures-enqueue', '*/5 * * * *', async () => {
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
    }

    scheduleOddsRefreshJobs() {
        // Every 30 seconds: enqueue per-fixture BM odds refresh jobs
        this.scheduleTask('cricket-odds-refresh-for-fixtures', '*/30 * * * * *', async () => {
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