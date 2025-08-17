const crypto = require('crypto');

/**
 * Cache Manager
 * Handles Redis-based caching with TTL, key generation, and cache policies
 */
class CacheManager {
  constructor(redisClient, logger) {
    this.redis = redisClient;
    this.logger = logger;
    this.keyPrefix = 'proxy:cache:';
    this.fallbackPrefix = 'proxy:fallback:';
    this.maxKeyLength = 250; // Redis key length limit
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  /**
   * Get cached value
   */
  async get(key) {
    try {
      const fullKey = this.keyPrefix + key;
      const cached = await this.redis.get(fullKey);
      
      if (cached) {
        this.stats.hits++;
        this.logger.debug(`Cache hit: ${key}`);
        return JSON.parse(cached);
      } else {
        this.stats.misses++;
        this.logger.debug(`Cache miss: ${key}`);
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key, value, ttl) {
    try {
      const fullKey = this.keyPrefix + key;
      const serialized = JSON.stringify(value);
      
      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serialized);
        
        // Also store as fallback data (longer TTL for emergency use)
        const fallbackKey = this.fallbackPrefix + key;
        const fallbackTtl = Math.max(ttl * 5, 3600); // 5x original TTL or 1 hour minimum
        await this.redis.setex(fallbackKey, fallbackTtl, serialized);
      } else {
        await this.redis.set(fullKey, serialized);
      }
      
      this.stats.sets++;
      this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async del(key) {
    try {
      const fullKey = this.keyPrefix + key;
      const fallbackKey = this.fallbackPrefix + key;
      
      const deleted = await this.redis.del(fullKey, fallbackKey);
      this.stats.deletes++;
      this.logger.debug(`Cache delete: ${key}`);
      return deleted > 0;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    try {
      const fullKey = this.keyPrefix + key;
      const exists = await this.redis.exists(fullKey);
      return exists === 1;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get TTL for cached key
   */
  async ttl(key) {
    try {
      const fullKey = this.keyPrefix + key;
      return await this.redis.ttl(fullKey);
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache TTL error:', error);
      return -1;
    }
  }

  /**
   * Get fallback cached value (ignoring TTL)
   */
  async getFallback(key) {
    try {
      const fallbackKey = this.fallbackPrefix + key;
      const cached = await this.redis.get(fallbackKey);
      
      if (cached) {
        this.logger.debug(`Fallback cache hit: ${key}`);
        return JSON.parse(cached);
      } else {
        this.logger.debug(`Fallback cache miss: ${key}`);
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Fallback cache get error:', error);
      return null;
    }
  }

  /**
   * Generate cache key from provider, endpoint, and parameters
   */
  generateCacheKey(provider, endpoint, params = {}) {
    // Create a deterministic string from parameters
    const paramString = this.serializeParams(params);
    const baseKey = `${provider}:${endpoint}:${paramString}`;
    
    // If key is too long, hash it
    if (baseKey.length > this.maxKeyLength - this.keyPrefix.length) {
      const hash = crypto.createHash('sha256').update(baseKey).digest('hex');
      return `${provider}:${endpoint}:${hash}`;
    }
    
    return baseKey;
  }

  /**
   * Serialize parameters for consistent cache key generation
   */
  serializeParams(params) {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }
    
    // Sort keys for consistent ordering
    const sortedKeys = Object.keys(params).sort();
    const sortedParams = {};
    
    for (const key of sortedKeys) {
      sortedParams[key] = params[key];
    }
    
    return crypto.createHash('md5').update(JSON.stringify(sortedParams)).digest('hex');
  }

  /**
   * Determine if response should be cached
   */
  shouldCache(method, statusCode, headers = {}) {
    // Only cache GET requests
    if (method.toLowerCase() !== 'get') {
      return false;
    }
    
    // Only cache successful responses
    if (statusCode < 200 || statusCode >= 300) {
      return false;
    }
    
    // Check cache-control headers
    const cacheControl = headers['cache-control'] || '';
    if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
      return false;
    }
    
    // Check for private cache directive
    if (cacheControl.includes('private')) {
      return false;
    }
    
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      totalOperations: this.stats.hits + this.stats.misses + this.stats.sets + this.stats.deletes
    };
  }

  /**
   * Clear all cache statistics
   */
  clearStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  /**
   * Clear all cached data for a provider
   */
  async clearProvider(providerId) {
    try {
      const pattern = `${this.keyPrefix}${providerId}:*`;
      const fallbackPattern = `${this.fallbackPrefix}${providerId}:*`;
      
      // Get all keys matching the pattern
      const keys = await this.redis.keys(pattern);
      const fallbackKeys = await this.redis.keys(fallbackPattern);
      
      const allKeys = [...keys, ...fallbackKeys];
      
      if (allKeys.length > 0) {
        await this.redis.del(...allKeys);
        this.logger.info(`Cleared ${allKeys.length} cache entries for provider: ${providerId}`);
        return allKeys.length;
      }
      
      return 0;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache clear provider error:', error);
      return 0;
    }
  }

  /**
   * Clear all cached data
   */
  async clearAll() {
    try {
      const pattern = `${this.keyPrefix}*`;
      const fallbackPattern = `${this.fallbackPrefix}*`;
      
      const keys = await this.redis.keys(pattern);
      const fallbackKeys = await this.redis.keys(fallbackPattern);
      
      const allKeys = [...keys, ...fallbackKeys];
      
      if (allKeys.length > 0) {
        await this.redis.del(...allKeys);
        this.logger.info(`Cleared ${allKeys.length} cache entries`);
        return allKeys.length;
      }
      
      return 0;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache clear all error:', error);
      return 0;
    }
  }

  /**
   * Get cache size information
   */
  async getCacheSize() {
    try {
      const pattern = `${this.keyPrefix}*`;
      const fallbackPattern = `${this.fallbackPrefix}*`;
      
      const keys = await this.redis.keys(pattern);
      const fallbackKeys = await this.redis.keys(fallbackPattern);
      
      return {
        activeKeys: keys.length,
        fallbackKeys: fallbackKeys.length,
        totalKeys: keys.length + fallbackKeys.length
      };
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache size error:', error);
      return {
        activeKeys: 0,
        fallbackKeys: 0,
        totalKeys: 0
      };
    }
  }

  /**
   * Health check for cache system
   */
  async healthCheck() {
    try {
      const testKey = 'health:check:' + Date.now();
      const testValue = { test: true, timestamp: Date.now() };
      
      // Test set
      await this.set(testKey, testValue, 60);
      
      // Test get
      const retrieved = await this.get(testKey);
      
      // Test delete
      await this.del(testKey);
      
      const isHealthy = retrieved && retrieved.test === true;
      
      return {
        healthy: isHealthy,
        stats: this.getStats(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache health check error:', error);
      return {
        healthy: false,
        error: error.message,
        stats: this.getStats(),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.clearStats();
  }
}

module.exports = CacheManager;