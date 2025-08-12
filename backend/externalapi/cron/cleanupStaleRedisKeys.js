const logger = require('../utils/logger');
const redis = require('../utils/redisClient');

const PATTERNS = [
  'cricket:scorecard:detailed:*',
  'cricket:odds:*',
  'casino:results'
];

async function scanKeys(pattern) {
  const client = redis.client;
  if (!client) return [];
  const keys = [];
  let cursor = '0';
  do {
    const [next, slice] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = next;
    if (Array.isArray(slice)) keys.push(...slice);
  } while (cursor !== '0');
  return keys;
}

async function cleanupStaleRedisKeys() {
  try {
    let cleaned = 0;
    for (const pattern of PATTERNS) {
      const keys = await scanKeys(pattern);
      for (const key of keys) {
        try {
          const ttl = await redis.ttl(key);
          if (ttl === -2) continue; // already gone
          if (ttl === -1) continue; // no ttl
          if (ttl <= 0) {
            await redis.del(key);
            cleaned++;
          }
        } catch (_) {}
      }
    }
    logger.info(`cleanupStaleRedisKeys: cleaned=${cleaned}`);
    return { cleaned };
  } catch (error) {
    logger.error('cleanupStaleRedisKeys error:', error);
    return { cleaned: 0, error: error.message };
  }
}

module.exports = { cleanupStaleRedisKeys };