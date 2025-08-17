const logger = require('../utils/logger');
const redis = require('../utils/redisClient');

const PATTERNS = [
  'cricket:scorecard:detailed:*',
  'cricket:odds:*',
  'casino:results',
  'fixture:*' // Add individual fixture keys
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

async function cleanupCompletedMatches() {
  try {
    const client = redis.client;
    if (!client) return { cleaned: 0 };
    
    // Scan for individual fixture keys
    const fixtureKeys = await scanKeys('fixture:*');
    let cleaned = 0;
    
    for (const key of fixtureKeys) {
      try {
        const fixture = await redis.get(key);
        if (fixture && (fixture.status === 'completed' || fixture.status === 'finished')) {
          await redis.del(key);
          cleaned++;
          logger.info(`🗑️ Cleaned up completed match: ${fixture.name || key}`);
        }
      } catch (error) {
        logger.warn(`Failed to process fixture key ${key}:`, error.message);
      }
    }
    
    logger.info(`cleanupCompletedMatches: cleaned=${cleaned}`);
    return { cleaned };
  } catch (error) {
    logger.error('cleanupCompletedMatches error:', error);
    return { cleaned: 0, error: error.message };
  }
}

module.exports = { cleanupStaleRedisKeys, cleanupCompletedMatches };