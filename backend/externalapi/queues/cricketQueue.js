const { addJob, queueManager, initializeQueues } = require('./queue');
const logger = require('../utils/logger');

const CRICKET_QUEUE_NAME = 'cricket';
const CRICKET_JOB_FETCH_FIXTURES = 'fetch-fixtures';
const CRICKET_JOB_FETCH_ODDS = 'fetch-cricket-odds';
const CRICKET_JOB_FETCH_SCORECARDS = 'fetch-cricket-scorecards';

async function ensureQueuesInitialized() {
  if (!queueManager.queues || !queueManager.queues[CRICKET_QUEUE_NAME]) {
    await initializeQueues();
  }
}

async function addFetchFixturesJob(payload = {}) {
  await ensureQueuesInitialized();
  const jobData = { ...payload, requestedAt: new Date().toISOString() };
  const job = await addJob(CRICKET_QUEUE_NAME, CRICKET_JOB_FETCH_FIXTURES, jobData, {
    removeOnComplete: 100,
    removeOnFail: 25
  });
  logger.info(`Enqueued cricket job ${CRICKET_JOB_FETCH_FIXTURES} → ${job.id}`);
  return job;
}

async function addFetchOddsJob(payload = {}) {
  await ensureQueuesInitialized();
  const jobData = { ...payload, requestedAt: new Date().toISOString() };
  const job = await addJob(CRICKET_QUEUE_NAME, CRICKET_JOB_FETCH_ODDS, jobData, {
    removeOnComplete: 200,
    removeOnFail: 50
  });
  logger.info(`Enqueued cricket job ${CRICKET_JOB_FETCH_ODDS} → ${job.id}`);
  return job;
}

const addFetchCricketOddsJob = addFetchOddsJob;

async function addFetchCricketScorecardsJob(payload = {}) {
  await ensureQueuesInitialized();
  const jobData = { ...payload, requestedAt: new Date().toISOString() };
  const job = await addJob(CRICKET_QUEUE_NAME, CRICKET_JOB_FETCH_SCORECARDS, jobData, {
    removeOnComplete: 200,
    removeOnFail: 50
  });
  logger.info(`Enqueued cricket job ${CRICKET_JOB_FETCH_SCORECARDS} → ${job.id}`);
  return job;
}

module.exports = {
  CRICKET_QUEUE_NAME,
  CRICKET_JOB_FETCH_FIXTURES,
  CRICKET_JOB_FETCH_ODDS,
  CRICKET_JOB_FETCH_SCORECARDS,
  addFetchFixturesJob,
  addFetchOddsJob,
  addFetchCricketOddsJob,
  addFetchCricketScorecardsJob
};