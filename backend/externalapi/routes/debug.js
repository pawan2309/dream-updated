const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const config = require('../../config');

// Ensure fetch is available (Node.js 18+ has it natively, but add fallback)
let fetch;
try {
    // Try to use native fetch first
    fetch = global.fetch;
    if (!fetch) {
        // Fallback to node-fetch if available
        fetch = require('node-fetch');
    }
} catch (error) {
    logger.warn('⚠️ Fetch not available, using axios fallback');
    const axios = require('axios');
    fetch = async (url, options) => {
        try {
            const response = await axios(url, options);
            return {
                ok: response.status >= 200 && response.status < 300,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                text: async () => response.data,
                json: async () => response.data
            };
        } catch (error) {
            return {
                ok: false,
                status: error.response?.status || 500,
                statusText: error.response?.statusText || 'Internal Error',
                headers: error.response?.headers || {},
                text: async () => error.message,
                json: async () => ({ error: error.message })
            };
        }
    };
}

/**
 * Debug route to test external APIs directly
 * This helps troubleshoot API connectivity and response issues
 */

// GET /debug/test-cricket-api - Test cricket fixtures API directly
router.get('/test-cricket-api', async (req, res) => {
    try {
        logger.info('🧪 Debug: Testing cricket fixtures API directly...');
        
        const apiUrl = config.api.cricketFixtures;
        logger.info(`🌐 API URL: ${apiUrl}`);
        logger.info(`🔍 Fetch function type: ${typeof fetch}`);
        logger.info(`🔍 Global fetch available: ${!!global.fetch}`);
        
        // Test 1: Basic fetch
        logger.info('📡 Test 1: Basic fetch request...');
        const startTime = Date.now();
        
        const response = await fetch(apiUrl);
        const responseTime = Date.now() - startTime;
        
        logger.info(`📡 Response received in ${responseTime}ms`);
        logger.info(`📡 Status: ${response.status}`);
        logger.info(`📡 Status Text: ${response.statusText}`);
        logger.info(`📡 Headers:`, Object.fromEntries(response.headers.entries()));
        
        // Test 2: Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`❌ API Error: ${response.status} - ${errorText}`);
            
            return res.status(500).json({
                success: false,
                error: `API responded with status: ${response.status}`,
                details: errorText,
                apiUrl,
                responseTime
            });
        }
        
        // Test 3: Parse response
        logger.info('📡 Test 3: Parsing response...');
        const responseText = await response.text();
        logger.info(`📡 Raw response length: ${responseText.length} characters`);
        logger.info(`📡 Raw response preview: ${responseText.substring(0, 500)}...`);
        
        // Test 4: Try to parse as JSON
        let parsedData;
        try {
            parsedData = JSON.parse(responseText);
            logger.info('✅ Successfully parsed as JSON');
        } catch (parseError) {
            logger.error('❌ Failed to parse as JSON:', parseError.message);
            return res.status(500).json({
                success: false,
                error: 'Response is not valid JSON',
                details: parseError.message,
                rawResponse: responseText,
                apiUrl,
                responseTime
            });
        }
        
        // Test 5: Analyze parsed data
        logger.info('📊 Test 5: Analyzing parsed data...');
        logger.info(`📊 Data type: ${typeof parsedData}`);
        logger.info(`📊 Is array: ${Array.isArray(parsedData)}`);
        logger.info(`📊 Length: ${Array.isArray(parsedData) ? parsedData.length : 'N/A'}`);
        
        if (Array.isArray(parsedData)) {
            if (parsedData.length === 0) {
                logger.warn('⚠️ API returned empty array - no fixtures available');
            } else {
                logger.info(`📊 Sample fixture:`, parsedData[0]);
                logger.info(`📊 Total fixtures: ${parsedData.length}`);
            }
        } else {
            logger.warn(`⚠️ API response is not an array: ${typeof parsedData}`);
            logger.warn(`⚠️ Response structure:`, parsedData);
        }
        
        // Test 6: Check Redis cache
        logger.info('💾 Test 6: Checking Redis cache...');
        const redis = require('../utils/redis');
        const cacheKey = 'cricket:fixtures';
        
        try {
            // Ensure Redis is connected
            if (!redis.isConnected) {
                logger.info('🔌 Redis not connected, connecting...');
                await redis.connect();
            }
            
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info(`📋 Cache HIT: ${cached.length} fixtures cached`);
            } else {
                logger.info('📋 Cache MISS: No cached data');
            }
        } catch (redisError) {
            logger.error('❌ Redis error:', redisError.message);
        }
        
        // Return comprehensive test results
        const testResults = {
            success: true,
            apiUrl,
            responseTime: `${responseTime}ms`,
            response: {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                size: responseText.length
            },
            data: {
                type: typeof parsedData,
                isArray: Array.isArray(parsedData),
                length: Array.isArray(parsedData) ? parsedData.length : 'N/A',
                sample: Array.isArray(parsedData) && parsedData.length > 0 ? parsedData[0] : null
            },
            timestamp: new Date().toISOString()
        };
        
        logger.info('✅ Debug test completed successfully');
        res.json(testResults);
        
    } catch (error) {
        logger.error('❌ Debug test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /debug/test-redis - Test Redis connection and operations
router.get('/test-redis', async (req, res) => {
    try {
        logger.info('🧪 Debug: Testing Redis connection...');
        
        const redis = require('../utils/redis');
        
        // Ensure Redis is connected
        if (!redis.isConnected) {
            logger.info('🔌 Redis not connected, connecting...');
            await redis.connect();
        }
        
        // Test 1: Connection status
        const connectionStatus = redis.getConnectionStatus();
        logger.info('🔍 Redis connection status:', connectionStatus);
        
        // Test 2: Basic operations
        const testKey = 'debug:test';
        const testValue = { message: 'Hello Redis', timestamp: new Date().toISOString() };
        
        logger.info(`💾 Testing Redis set: ${testKey}`);
        await redis.set(testKey, testValue, 60);
        
        logger.info('💾 Testing Redis get...');
        const retrieved = await redis.get(testKey);
        
        logger.info('💾 Testing Redis exists...');
        const exists = await redis.exists(testKey);
        
        logger.info('💾 Testing Redis TTL...');
        const ttl = await redis.ttl(testKey);
        
        // Test 3: Clean up
        await redis.del(testKey);
        
        const testResults = {
            success: true,
            connectionStatus,
            operations: {
                set: true,
                get: retrieved && retrieved.message === 'Hello Redis',
                exists,
                ttl: ttl > 0,
                retrieved
            },
            timestamp: new Date().toISOString()
        };
        
        logger.info('✅ Redis test completed successfully');
        res.json(testResults);
        
    } catch (error) {
        logger.error('❌ Redis test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /debug/test-queue - Test queue system
router.get('/test-queue', async (req, res) => {
    try {
        logger.info('🧪 Debug: Testing queue system...');
        
        const { addJob, getQueueStatus, queueManager } = require('../queues/queue');
        
        // Test 1: Check if queues are already initialized
        if (!queueManager.queues || Object.keys(queueManager.queues).length === 0) {
            logger.info('🔄 Queues not initialized, initializing...');
            const { initializeQueues } = require('../queues/queue');
            await initializeQueues();
            logger.info('✅ Queues initialized');
        } else {
            logger.info('✅ Queues already initialized');
        }
        
        // Test 2: Add test job
        logger.info('📝 Adding test job...');
        const testJob = await addJob('cricket', 'fetchFixtures', {
            jobType: 'fetchFixtures',
            forceRefresh: true
        });
        logger.info(`✅ Test job added: ${testJob.id}`);
        
        // Test 3: Get queue status
        logger.info('📊 Getting queue status...');
        const status = await getQueueStatus('cricket');
        logger.info('📊 Queue status:', status);
        
        // Wait a bit for job to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test 4: Get updated status
        const updatedStatus = await getQueueStatus('cricket');
        
        const testResults = {
            success: true,
            testJob: testJob.id,
            initialStatus: status,
            updatedStatus,
            timestamp: new Date().toISOString()
        };
        
        logger.info('✅ Queue test completed successfully');
        res.json(testResults);
        
    } catch (error) {
        logger.error('❌ Queue test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /debug/config - Show current configuration
router.get('/config', (req, res) => {
    try {
        logger.info('🧪 Debug: Showing configuration...');
        
        const safeConfig = {
            nodeEnv: config.nodeEnv,
            redisUrl: config.redisUrl,
            redisHost: config.redisHost,
            redisPort: config.redisPort,
            redisDb: config.redisDb,
            ttl: config.ttl,
            api: {
                cricketFixtures: config.api.cricketFixtures,
                cricketOddsFeed: config.api.cricketOddsFeed,
                cricketScorecardDetailed: config.api.cricketScorecardDetailed,
                cricketBM: config.api.cricketBM,
                casinoResults: config.api.casinoResults
            }
        };
        
        res.json({
            success: true,
            config: safeConfig,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('❌ Config display failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /debug/test-redis-simple - Simple Redis connection test
router.get('/test-redis-simple', async (req, res) => {
    try {
        logger.info('🧪 Debug: Simple Redis connection test...');
        
        const Redis = require('ioredis');
        
        // Create a simple Redis connection
        const redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT, 10) || 6380,
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB, 10) || 0,
            lazyConnect: false // Connect immediately
        });
        
        // Test connection
        const ping = await redis.ping();
        logger.info(`📡 Redis ping response: ${ping}`);
        
        // Test basic operations
        const testKey = 'debug:simple:test';
        await redis.set(testKey, 'Hello Redis!', 'EX', 60);
        const value = await redis.get(testKey);
        await redis.del(testKey);
        
        // Close connection
        await redis.quit();
        
        const testResults = {
            success: true,
            ping: ping,
            setGetTest: value === 'Hello Redis!',
            timestamp: new Date().toISOString()
        };
        
        logger.info('✅ Simple Redis test completed successfully');
        res.json(testResults);
        
    } catch (error) {
        logger.error('❌ Simple Redis test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /debug/queue-status - Simple queue status check
router.get('/queue-status', async (req, res) => {
    try {
        logger.info('🧪 Debug: Checking queue status...');
        
        const { queueManager } = require('../queues/queue');
        
        // Check current queue state
        const queueState = {
            queuesInitialized: !!queueManager.queues,
            queueCount: queueManager.queues ? Object.keys(queueManager.queues).length : 0,
            workersInitialized: !!queueManager.workers,
            workerCount: queueManager.workers ? Object.keys(queueManager.workers).length : 0,
            redisConnection: queueManager.queues && queueManager.queues.cricket ? 'connected' : 'not connected'
        };
        
        logger.info('📊 Queue state:', queueState);
        
        res.json({
            success: true,
            queueState,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('❌ Queue status check failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
