const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

// Import job processors
const cricketJobProcessor = require('./jobs/cricketJobs');
const casinoJobProcessor = require('./jobs/casinoJobs');

// Import logger
const logger = require('./utils/logger');

// Redis connection for BullMQ
const redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: null,  // ✅ Required for BullMQ
    lazyConnect: true
});

// Queue configurations
const queueConfigs = {
    cricket: {
        name: 'cricket-data-queue',
        concurrency: 5,
        processor: cricketJobProcessor
    },
    casino: {
        name: 'casino-data-queue', 
        concurrency: 3,
        processor: casinoJobProcessor
    }
};

class QueueManager {
    constructor() {
        this.queues = {};
        this.workers = {};
    }

    async initializeQueues() {
        try {
            logger.info('🔄 Initializing BullMQ queues...');

            // Create queues
            for (const [key, config] of Object.entries(queueConfigs)) {
                this.queues[key] = new Queue(config.name, {
                    connection: redisConnection,
                    defaultJobOptions: {
                        removeOnComplete: 100, // Keep last 100 completed jobs
                        removeOnFail: 50,      // Keep last 50 failed jobs
                        attempts: 3,           // Retry failed jobs 3 times
                        backoff: {
                            type: 'exponential',
                            delay: 2000        // Start with 2s delay
                        }
                    }
                });

                logger.info(`✅ Created queue: ${config.name}`);
            }

            // Create workers
            await this.createWorkers();

            // Setup queue event listeners
            this.setupQueueEventListeners();

            logger.info('✅ All BullMQ queues and workers initialized');
            return this.queues;

        } catch (error) {
            logger.error('❌ Failed to initialize queues:', error);
            throw error;
        }
    }

    async createWorkers() {
        for (const [key, config] of Object.entries(queueConfigs)) {
            const worker = new Worker(config.name, config.processor, {
                connection: redisConnection,
                concurrency: config.concurrency,
                autorun: true
            });

            this.workers[key] = worker;

            // Setup worker event listeners
            this.setupWorkerEventListeners(worker, key);

            logger.info(`✅ Created worker for ${config.name} with concurrency ${config.concurrency}`);
        }
    }

    setupQueueEventListeners() {
        for (const [key, queue] of Object.entries(this.queues)) {
            queue.on('waiting', (job) => {
                logger.debug(`⏳ Job ${job.id} waiting in ${key} queue`);
            });

            queue.on('active', (job) => {
                logger.debug(`🔄 Job ${job.id} started processing in ${key} queue`);
            });

            queue.on('completed', (job, result) => {
                logger.info(`✅ Job ${job.id} completed in ${key} queue`);
            });

            queue.on('failed', (job, err) => {
                logger.error(`❌ Job ${job.id} failed in ${key} queue:`, err.message);
            });

            queue.on('stalled', (job) => {
                logger.warn(`⚠️ Job ${job.id} stalled in ${key} queue`);
            });

            queue.on('error', (error) => {
                logger.error(`❌ Queue ${key} error:`, error);
            });
        }
    }

    setupWorkerEventListeners(worker, queueName) {
        worker.on('ready', () => {
            logger.info(`👷 Worker ready for ${queueName} queue`);
        });

        worker.on('active', (job) => {
            logger.debug(`🔄 Worker processing job ${job.id} in ${queueName} queue`);
        });

        worker.on('completed', (job, result) => {
            logger.info(`✅ Worker completed job ${job.id} in ${queueName} queue`);
        });

        worker.on('failed', (job, err) => {
            logger.error(`❌ Worker failed job ${job.id} in ${queueName} queue:`, err.message);
        });

        worker.on('error', (error) => {
            logger.error(`❌ Worker error in ${queueName} queue:`, error);
        });

        worker.on('stalled', (jobId) => {
            logger.warn(`⚠️ Worker stalled job ${jobId} in ${queueName} queue`);
        });
    }

    async addJob(queueName, jobType, data, options = {}) {
        try {
            if (!this.queues[queueName]) {
                throw new Error(`Queue ${queueName} not found`);
            }

            const job = await this.queues[queueName].add(jobType, data, {
                ...options,
                jobId: `${jobType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });

            logger.info(`📝 Added job ${job.id} to ${queueName} queue`);
            return job;

        } catch (error) {
            logger.error(`❌ Failed to add job to ${queueName} queue:`, error);
            throw error;
        }
    }

    async getQueueStatus(queueName) {
        try {
            if (!this.queues[queueName]) {
                throw new Error(`Queue ${queueName} not found`);
            }

            const queue = this.queues[queueName];
            const [waiting, active, completed, failed] = await Promise.all([
                queue.getWaiting(),
                queue.getActive(),
                queue.getCompleted(),
                queue.getFailed()
            ]);

            return {
                name: queueName,
                waiting: waiting.length,
                active: active.length,
                completed: completed.length,
                failed: failed.length,
                total: waiting.length + active.length + completed.length + failed.length
            };

        } catch (error) {
            logger.error(`❌ Failed to get status for ${queueName} queue:`, error);
            throw error;
        }
    }

    async getAllQueueStatus() {
        const statuses = {};
        for (const queueName of Object.keys(this.queues)) {
            statuses[queueName] = await this.getQueueStatus(queueName);
        }
        return statuses;
    }

    async closeQueues() {
        try {
            logger.info('🛑 Closing BullMQ queues and workers...');

            // Close workers
            for (const [key, worker] of Object.entries(this.workers)) {
                await worker.close();
                logger.info(`✅ Closed worker for ${key} queue`);
            }

            // Close queues
            for (const [key, queue] of Object.entries(this.queues)) {
                await queue.close();
                logger.info(`✅ Closed ${key} queue`);
            }

            // Close Redis connection
            await redisConnection.quit();
            logger.info('✅ Closed Redis connection');

        } catch (error) {
            logger.error('❌ Error closing queues:', error);
            throw error;
        }
    }
}

// Create singleton instance
const queueManager = new QueueManager();

// Export initialization function
async function initializeQueues() {
    return await queueManager.initializeQueues();
}

// Export utility functions
async function addJob(queueName, jobType, data, options) {
    return await queueManager.addJob(queueName, jobType, data, options);
}

async function getQueueStatus(queueName) {
    return await queueManager.getQueueStatus(queueName);
}

async function getAllQueueStatus() {
    return await queueManager.getAllQueueStatus();
}

async function closeQueues() {
    return await queueManager.closeQueues();
}

module.exports = {
    initializeQueues,
    addJob,
    getQueueStatus,
    getAllQueueStatus,
    closeQueues,
    queueManager
}; 