const logger = require('../utils/logger');
const redis = require('../utils/redisClient');
const { cricketOddsQueue } = require('../queues/cricketOddsQueue');
const { extractEventIds } = require('../../shared/utils/extractEventIds');

const DEFAULT_INTERVAL_SECONDS = parseInt(process.env.CRON_INTERVAL_ODDS_REFRESH || '30', 10);

async function enqueueRefreshForFixtures() {
  try {
    const fixtures = await redis.get('cricket:fixtures');
    if (!Array.isArray(fixtures) || fixtures.length === 0) {
      logger.info('refreshOddsForFixtures: no fixtures found');
      return { enqueued: 0 };
    }

    const eventIds = extractEventIds(fixtures);

    let enqueued = 0;
    for (const eventId of eventIds) {
      await cricketOddsQueue.add('refresh', { eventId }, { jobId: `refresh:${eventId}` });
      enqueued++;
    }

    logger.info(`refreshOddsForFixtures: enqueued=${enqueued}`);
    return { enqueued };
  } catch (error) {
    logger.error('refreshOddsForFixtures error:', error);
    return { enqueued: 0, error: error.message };
  }
}

module.exports = {
  enqueueRefreshForFixtures,
  DEFAULT_INTERVAL_SECONDS
};