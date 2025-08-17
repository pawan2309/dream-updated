const { Queue, Worker, QueueScheduler } = require('bullmq');
const redis = require('../utils/redisClient');
const FixturesJobProcessor = require('../jobs/fixturesJobProcessor');
const logger = require('../utils/logger');

/**
 * Fixtures Queue Configuration
 * Manages BullMQ queues for sports fixtures processing
 */

class FixturesQueue {
  constructor() {
    this.connection = redis.client;
    this.fixturesQueue = null;
    this.fixturesWorker = null;
    this.fixturesScheduler = null;
    this.jobProcessor = new FixturesJobProcessor();
    
    // Queue configuration
    this.queueConfig = {
      defaultJobOptions: {
        removeOnComplete: 100,    // Keep last 100 completed jobs
        removeOnFail: 50,         // Keep last 50 failed jobs
        attempts: 3,               // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',    // Exponential backoff
          delay: 2000             // Start with 2 seconds
        }
      }
    };
    
    // Worker configuration
    this.workerConfig = {
      concurrency: 2,             // Process 2 jobs concurrently
      maxStalledCount: 1,         // Max stalled job attempts
      stalledInterval: 30000,     // Check for stalled jobs every 30s
      settings: {
        maxStalledCount: 1,
        guardInterval: 5000,      // Guard interval for stalled jobs
        retryProcessDelay: 5000   // Delay before retrying failed jobs
      }
    };
  }

  /**
   * Initialize fixtures queue system
   */
  async initialize() {
    try {
      logger.info('🏏 Fixtures Queue: Initializing queue system...');
      
      // Create queue
      this.fixturesQueue = new Queue('fixtures', {
        connection: this.connection,
        ...this.queueConfig
      });
      
      // Create scheduler for delayed/repeated jobs
      this.fixturesScheduler = new QueueScheduler('fixtures', {
        connection: this.connection
      });
      
      // Create worker
      this.fixturesWorker = new Worker('fixtures', 
        async (job) => {
          return await this.jobProcessor.process(job);
        },
        {
          connection: this.connection,
          ...this.workerConfig
        }
      );
      
      // Set up worker event handlers
      this.setupWorkerEventHandlers();
      
      // Set up queue event handlers
      this.setupQueueEventHandlers();
      
      logger.info('✅ Fixtures Queue: Queue system initialized successfully');
      
      return true;
      
    } catch (error) {
      logger.error('❌ Fixtures Queue: Failed to initialize queue system', { error: error.message });
      throw error;
    }
  }

  /**
   * Set up worker event handlers
   */
  setupWorkerEventHandlers() {
    if (!this.fixturesWorker) return;
    
    // Job started
    this.fixturesWorker.on('started', (job) => {
      logger.info(`🏏 Fixtures Worker: Job started`, { 
        jobId: job.id, 
        type: job.data.type,
        timestamp: new Date().toISOString()
      });
    });
    
    // Job completed
    this.fixturesWorker.on('completed', (job, result) => {
      logger.info(`✅ Fixtures Worker: Job completed successfully`, { 
        jobId: job.id, 
        type: job.data.type,
        result: result,
        duration: `${Date.now() - job.timestamp}ms`
      });
    });
    
    // Job failed
    this.fixturesWorker.on('failed', (job, err) => {
      logger.error(`❌ Fixtures Worker: Job failed`, { 
        jobId: job.id, 
        type: job.data.type,
        error: err.message,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts
      });
    });
    
    // Job stalled
    this.fixturesWorker.on('stalled', (jobId) => {
      logger.warn(`⚠️ Fixtures Worker: Job stalled`, { jobId });
    });
    
    // Worker error
    this.fixturesWorker.on('error', (err) => {
      logger.error(`❌ Fixtures Worker: Worker error`, { error: err.message });
    });
  }

  /**
   * Set up queue event handlers
   */
  setupQueueEventHandlers() {
    if (!this.fixturesQueue) return;
    
    // Job added to queue
    this.fixturesQueue.on('waiting', (job) => {
      logger.debug(`🏏 Fixtures Queue: Job waiting`, { 
        jobId: job.id, 
        type: job.data.type 
      });
    });
    
    // Job active
    this.fixturesQueue.on('active', (job) => {
      logger.debug(`🏏 Fixtures Queue: Job active`, { 
        jobId: job.id, 
        type: job.data.type 
      });
    });
    
    // Job completed
    this.fixturesQueue.on('completed', (job, result) => {
      logger.debug(`✅ Fixtures Queue: Job completed`, { 
        jobId: job.id, 
        type: job.data.type,
        result: result
      });
    });
    
    // Job failed
    this.fixturesQueue.on('failed', (job, err) => {
      logger.error(`❌ Fixtures Queue: Job failed`, { 
        jobId: job.id, 
        type: job.data.type,
        error: err.message
      });
    });
    
    // Job removed
    this.fixturesQueue.on('removed', (job) => {
      logger.debug(`🗑️ Fixtures Queue: Job removed`, { 
        jobId: job.id, 
        type: job.data.type 
      });
    });
  }

  /**
   * Add job to fixtures queue
   * @param {string} type - Job type (fetchLiveFixtures, fetchUpcomingFixtures, updateCompletedFixtures)
   * @param {Object} data - Job data
   * @param {Object} options - Job options (delay, priority, etc.)
   * @returns {Object} - Added job
   */
  async addJob(type, data = {}, options = {}) {
    try {
      if (!this.fixturesQueue) {
        throw new Error('Fixtures queue not initialized');
      }
      
      const jobData = { type, data };
      const jobOptions = {
        ...this.queueConfig.defaultJobOptions,
        ...options
      };
      
      const job = await this.fixturesQueue.add(type, jobData, jobOptions);
      
      logger.info(`🏏 Fixtures Queue: Added job to queue`, { 
        jobId: job.id, 
        type, 
        options: jobOptions 
      });
      
      return job;
      
    } catch (error) {
      logger.error(`❌ Fixtures Queue: Failed to add job`, { type, error: error.message });
      throw error;
    }
  }

  /**
   * Schedule recurring jobs for fixtures processing
   */
  async scheduleRecurringJobs() {
    try {
      logger.info('🏏 Fixtures Queue: Scheduling recurring jobs...');
      
      // Schedule live fixtures fetch every 2 minutes
      await this.addJob('fetchLiveFixtures', {}, {
        repeat: {
          pattern: '*/2 * * * *'  // Every 2 minutes
        },
        jobId: 'recurring-fetchLiveFixtures'
      });
      
      // Schedule upcoming fixtures fetch every 15 minutes
      await this.addJob('fetchUpcomingFixtures', {}, {
        repeat: {
          pattern: '*/15 * * * *'  // Every 15 minutes
        },
        jobId: 'recurring-fetchUpcomingFixtures'
      });
      
      // Schedule completed fixtures update every 30 minutes
      await this.addJob('updateCompletedFixtures', {}, {
        repeat: {
          pattern: '*/30 * * * *'  // Every 30 minutes
        },
        jobId: 'recurring-updateCompletedFixtures'
      });
      
      logger.info('✅ Fixtures Queue: Recurring jobs scheduled successfully');
      
    } catch (error) {
      logger.error('❌ Fixtures Queue: Failed to schedule recurring jobs', { error: error.message });
      throw error;
    }
  }

  /**
   * Get queue statistics
   * @returns {Object} - Queue statistics
   */
  async getQueueStats() {
    try {
      if (!this.fixturesQueue) {
        return { error: 'Queue not initialized' };
      }
      
      const waiting = await this.fixturesQueue.getWaiting();
      const active = await this.fixturesQueue.getActive();
      const completed = await this.fixturesQueue.getCompleted();
      const failed = await this.fixturesQueue.getFailed();
      const delayed = await this.fixturesQueue.getDelayed();
      
      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length
      };
      
    } catch (error) {
      logger.error('❌ Fixtures Queue: Failed to get queue stats', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Clean up old jobs
   * @param {number} daysOld - Remove jobs older than this many days
   * @returns {number} - Number of jobs cleaned up
   */
  async cleanupOldJobs(daysOld = 7) {
    try {
      if (!this.fixturesQueue) {
        return 0;
      }
      
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      let cleanedCount = 0;
      
      // Clean up completed jobs
      const completedJobs = await this.fixturesQueue.getCompleted();
      for (const job of completedJobs) {
        if (job.finishedOn < cutoffTime) {
          await job.remove();
          cleanedCount++;
        }
      }
      
      // Clean up failed jobs
      const failedJobs = await this.fixturesQueue.getFailed();
      for (const job of failedJobs) {
        if (job.finishedOn < cutoffTime) {
          await job.remove();
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        logger.info(`🧹 Fixtures Queue: Cleaned up ${cleanedCount} old jobs (older than ${daysOld} days)`);
      }
      
      return cleanedCount;
      
    } catch (error) {
      logger.error('❌ Fixtures Queue: Failed to cleanup old jobs', { error: error.message });
      return 0;
    }
  }

  /**
   * Pause queue processing
   */
  async pause() {
    try {
      if (this.fixturesWorker) {
        await this.fixturesWorker.pause();
        logger.info('⏸️ Fixtures Queue: Queue processing paused');
      }
    } catch (error) {
      logger.error('❌ Fixtures Queue: Failed to pause queue', { error: error.message });
    }
  }

  /**
   * Resume queue processing
   */
  async resume() {
    try {
      if (this.fixturesWorker) {
        await this.fixturesWorker.resume();
        logger.info('▶️ Fixtures Queue: Queue processing resumed');
      }
    } catch (error) {
      logger.error('❌ Fixtures Queue: Failed to resume queue', { error: error.message });
    }
  }

  /**
   * Close queue and worker
   */
  async close() {
    try {
      logger.info('🏏 Fixtures Queue: Closing queue system...');
      
      if (this.fixturesWorker) {
        await this.fixturesWorker.close();
        logger.info('✅ Fixtures Queue: Worker closed');
      }
      
      if (this.fixturesScheduler) {
        await this.fixturesScheduler.close();
        logger.info('✅ Fixtures Queue: Scheduler closed');
      }
      
      if (this.fixturesQueue) {
        await this.fixturesQueue.close();
        logger.info('✅ Fixtures Queue: Queue closed');
      }
      
      logger.info('✅ Fixtures Queue: Queue system closed successfully');
      
    } catch (error) {
      logger.error('❌ Fixtures Queue: Failed to close queue system', { error: error.message });
      throw error;
    }
  }

  /**
   * Health check for fixtures queue
   * @returns {Object} - Health status
   */
  async healthCheck() {
    try {
      const stats = await this.getQueueStats();
      const isHealthy = stats.error ? false : true;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        queue: stats,
        worker: this.fixturesWorker ? 'active' : 'inactive',
        scheduler: this.fixturesScheduler ? 'active' : 'inactive',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = FixturesQueue;
