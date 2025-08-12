const { addJob, queueManager, initializeQueues } = require('./queue');
const logger = require('../utils/logger');

const CASINO_QUEUE_NAME = 'casino';
const CASINO_JOB_FETCH_RESULTS = 'fetch-casino-results';

async function ensureQueuesInitialized() {
  if (!queueManager.queues || !queueManager.queues[CASINO_QUEUE_NAME]) {
    await initializeQueues();
  }
}

async function addFetchCasinoResultsJob(payload = {}) {
  await ensureQueuesInitialized();
  const jobData = { ...payload, requestedAt: new Date().toISOString() };
  const job = await addJob(CASINO_QUEUE_NAME, CASINO_JOB_FETCH_RESULTS, jobData, {
    removeOnComplete: 200,
    removeOnFail: 50
  });
  logger.info(`Enqueued casino job ${CASINO_JOB_FETCH_RESULTS} → ${job.id}`);
  return job;
}

module.exports = {
  CASINO_QUEUE_NAME,
  CASINO_JOB_FETCH_RESULTS,
  addFetchCasinoResultsJob
};