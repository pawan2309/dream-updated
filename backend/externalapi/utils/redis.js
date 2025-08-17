const Redis = require('ioredis');
const logger = require('./logger');

class RedisManager {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
    }

    async connect() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
            
            this.client = new Redis(redisUrl, {
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: null,  // ✅ Required for BullMQ
                lazyConnect: true,
                reconnectOnError: (err) => {
                    const targetError = 'READONLY';
                    if (err.message.includes(targetError)) {
                        return true;
                    }
                    return false;
                },
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });

            // Setup event listeners
            this.setupEventListeners();

            // Connect to Redis
            await this.client.connect();
            this.isConnected = true;
            this.reconnectAttempts = 0;

            logger.info('✅ Redis connected successfully');
            return this.client;

        } catch (error) {
            logger.error('❌ Failed to connect to Redis:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.client.on('connect', () => {
            logger.info('🔌 Redis connecting...');
        });

        this.client.on('ready', () => {
            logger.info('✅ Redis ready');
            this.isConnected = true;
        });

        this.client.on('error', (error) => {
            logger.error('❌ Redis error:', error);
            this.isConnected = false;
        });

        this.client.on('close', () => {
            logger.warn('🔌 Redis connection closed');
            this.isConnected = false;
        });

        this.client.on('reconnecting', () => {
            logger.info('🔄 Redis reconnecting...');
            this.reconnectAttempts++;
        });

        this.client.on('end', () => {
            logger.warn('🔌 Redis connection ended');
            this.isConnected = false;
        });
    }

    async disconnect() {
        try {
            if (this.client) {
                await this.client.quit();
                this.isConnected = false;
                logger.info('✅ Redis disconnected');
            }
        } catch (error) {
            logger.error('❌ Error disconnecting Redis:', error);
            throw error;
        }
    }

    // Cache operations
    async set(key, value, ttl = 3600) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
            await this.client.setex(key, ttl, serializedValue);
            logger.debug(`💾 Cached: ${key} (TTL: ${ttl}s)`);
            return true;
        } catch (error) {
            logger.error(`❌ Failed to set cache key ${key}:`, error);
            throw error;
        }
    }

    async get(key) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const value = await this.client.get(key);
            if (value === null) {
                return null;
            }

            // Try to parse as JSON, fallback to string
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            logger.error(`❌ Failed to get cache key ${key}:`, error);
            throw error;
        }
    }

    async del(key) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const result = await this.client.del(key);
            logger.debug(`🗑️ Deleted cache key: ${key}`);
            return result;
        } catch (error) {
            logger.error(`❌ Failed to delete cache key ${key}:`, error);
            throw error;
        }
    }

    async exists(key) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            logger.error(`❌ Failed to check existence of key ${key}:`, error);
            throw error;
        }
    }

    async expire(key, ttl) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const result = await this.client.expire(key, ttl);
            logger.debug(`⏰ Set TTL for ${key}: ${ttl}s`);
            return result;
        } catch (error) {
            logger.error(`❌ Failed to set TTL for key ${key}:`, error);
            throw error;
        }
    }

    async ttl(key) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            return await this.client.ttl(key);
        } catch (error) {
            logger.error(`❌ Failed to get TTL for key ${key}:`, error);
            throw error;
        }
    }

    // Add setex method for explicit set with expiry
    async setex(key, ttl, value) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
            await this.client.setex(key, ttl, serializedValue);
            logger.debug(`💾 SETEX: ${key} (TTL: ${ttl}s)`);
            return true;
        } catch (error) {
            logger.error(`❌ Failed to setex cache key ${key}:`, error);
            throw error;
        }
    }

    // Hash operations for complex data
    async hset(key, field, value) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
            await this.client.hset(key, field, serializedValue);
            logger.debug(`💾 HSET: ${key}.${field}`);
            return true;
        } catch (error) {
            logger.error(`❌ Failed to hset ${key}.${field}:`, error);
            throw error;
        }
    }

    async hget(key, field) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const value = await this.client.hget(key, field);
            if (value === null) {
                return null;
            }

            // Try to parse as JSON, fallback to string
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            logger.error(`❌ Failed to hget ${key}.${field}:`, error);
            throw error;
        }
    }

    async hgetall(key) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const hash = await this.client.hgetall(key);
            const result = {};

            for (const [field, value] of Object.entries(hash)) {
                try {
                    result[field] = JSON.parse(value);
                } catch {
                    result[field] = value;
                }
            }

            return result;
        } catch (error) {
            logger.error(`❌ Failed to hgetall ${key}:`, error);
            throw error;
        }
    }

    // List operations
    async lpush(key, value) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
            const result = await this.client.lpush(key, serializedValue);
            logger.debug(`📝 LPUSH: ${key}`);
            return result;
        } catch (error) {
            logger.error(`❌ Failed to lpush ${key}:`, error);
            throw error;
        }
    }

    async rpop(key) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const value = await this.client.rpop(key);
            if (value === null) {
                return null;
            }

            // Try to parse as JSON, fallback to string
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            logger.error(`❌ Failed to rpop ${key}:`, error);
            throw error;
        }
    }

    // Utility methods
    async flushdb() {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            await this.client.flushdb();
            logger.warn('🗑️ Redis database flushed');
            return true;
        } catch (error) {
            logger.error('❌ Failed to flush Redis database:', error);
            throw error;
        }
    }

    async ping() {
        try {
            if (!this.isConnected) {
                return false;
            }

            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error) {
            logger.error('❌ Redis ping failed:', error);
            return false;
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            status: this.client ? this.client.status : 'disconnected'
        };
    }

    isReady() {
        return this.client && this.client.status === 'ready';
    }
}

// Create singleton instance
const redisManager = new RedisManager();

// Export functions
async function connect() { return await redisManager.connect(); }
async function disconnect() { return await redisManager.disconnect(); }
async function set(key, value, ttl) { return await redisManager.set(key, value, ttl); }
async function setex(key, ttl, value) { return await redisManager.setex(key, ttl, value); }
async function get(key) { return await redisManager.get(key); }
async function del(key) { return await redisManager.del(key); }
async function exists(key) { return await redisManager.exists(key); }
async function expire(key, ttl) { return await redisManager.expire(key, ttl); }
async function ttl(key) { return await redisManager.ttl(key); }
async function hset(key, field, value) { return await redisManager.hset(key, field, value); }
async function hget(key, field) { return await redisManager.hget(key, field); }
async function hgetall(key) { return await redisManager.hgetall(key); }
async function lpush(key, value) { return await redisManager.lpush(key, value); }
async function rpop(key) { return await redisManager.rpop(key); }
async function flushdb() { return await redisManager.flushdb(); }
async function ping() { return await redisManager.ping(); }
function getConnectionStatus() { return redisManager.getConnectionStatus(); }
function isReady() { return redisManager.isReady(); }

module.exports = {
    connect,
    disconnect,
    set,
    setex,
    get,
    del,
    exists,
    expire,
    ttl,
    hset,
    hget,
    hgetall,
    lpush,
    rpop,
    flushdb,
    ping,
    getConnectionStatus,
    isReady,
    get client() { return redisManager.client; },
    get isConnected() { return redisManager.isConnected; }
}; 