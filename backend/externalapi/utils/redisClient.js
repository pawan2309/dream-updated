// Proper Redis client wrapper that ensures all functions are accessible
const redis = require('./redis');

// Re-export all Redis functions to ensure they're accessible
module.exports = {
    ...redis,
    // Ensure these critical functions are directly accessible
    connect: redis.connect,
    disconnect: redis.disconnect,
    set: redis.set,
    get: redis.get,
    del: redis.del,
    exists: redis.exists,
    expire: redis.expire,
    ttl: redis.ttl,
    hset: redis.hset,
    hget: redis.hget,
    hgetall: redis.hgetall,
    lpush: redis.lpush,
    rpop: redis.rpop,
    flushdb: redis.flushdb,
    ping: redis.ping,
    keys: redis.keys, // Add keys function for pattern matching
    getConnectionStatus: redis.getConnectionStatus,
    client: redis.client,
    isConnected: redis.isConnected
};

