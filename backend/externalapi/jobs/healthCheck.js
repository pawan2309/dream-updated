const logger = require('../utils/logger');
const redis = require('../utils/redisClient');
const db = require('../utils/pgClient');

const FIXTURES_KEY = 'cricket:fixtures';
const CASINO_RESULTS_KEY = 'casino:results';

async function checkRedis() {
  try {
    return (await redis.ping()) ? 'ok' : 'down';
  } catch {
    return 'down';
  }
}

async function checkPostgres() {
  try {
    await db.query('SELECT 1');
    return 'ok';
  } catch (e) {
    return 'down';
  }
}

async function keyFreshness(key, thresholdSeconds) {
  try {
    const ttl = await redis.ttl(key);
    if (ttl === -2) return false; // key does not exist
    if (ttl === -1) return true;  // no expiration set but exists
    return ttl > 0 && ttl <= thresholdSeconds; // still within expected TTL window
  } catch (e) {
    return false;
  }
}

async function runHealthCheck() {
  const [redisStatus, postgresStatus, fixturesFresh, casinoFresh] = await Promise.all([
    checkRedis(),
    checkPostgres(),
    keyFreshness(FIXTURES_KEY, 300), // fixtures expected TTL window ~5m
    keyFreshness(CASINO_RESULTS_KEY, 60) // casino results expected TTL window ~60s
  ]);

  const result = {
    redis: redisStatus,
    postgres: postgresStatus,
    fixturesFresh,
    casinoFresh,
    timestamp: new Date().toISOString()
  };

  logger.info(`Health check: ${JSON.stringify(result)}`);
  return result;
}

module.exports = {
  runHealthCheck
};