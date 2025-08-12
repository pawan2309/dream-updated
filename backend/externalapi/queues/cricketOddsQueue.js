const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const logger = require('../utils/logger');
const { fetchCricketOddsData } = require('../jobs/fetchCricketOddsData');

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

const QUEUE_NAME = 'cricket-odds-refresh';

const cricketOddsQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
});

// Worker to process refresh jobs
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { eventId } = job.data || {};
    if (!eventId) {
      logger.warn('cricket-odds-refresh: missing eventId in job data');
      return null;
    }
    const res = await fetchCricketOddsData(eventId);
    logger.info(`cricket-odds-refresh processed eventId=${eventId}`);
    return res;
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.CRICKET_ODDS_REFRESH_CONCURRENCY || '5', 10)
  }
);

worker.on('completed', (job) => {
  logger.info(`✅ cricket-odds-refresh completed jobId=${job.id}`);
});
worker.on('failed', (job, err) => {
  logger.error(`❌ cricket-odds-refresh failed jobId=${job?.id}: ${err?.message}`);
});
worker.on('error', (err) => {
  logger.error('❌ cricket-odds-refresh worker error:', err);
});

module.exports = {
  cricketOddsQueue
};