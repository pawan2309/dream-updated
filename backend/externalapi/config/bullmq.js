const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: process.env.REDIS_DB || 0,
  maxRetriesPerRequest: null, // Required for BullMQ
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true
};

// Create Redis connection
const redis = new Redis(redisConfig);

// Queue configurations
const queueConfigs = {
  'live-fixtures': {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30000 // 30 seconds
      }
    }
  },
  'upcoming-fixtures': {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000 // 60 seconds
      }
    }
  },
  'completed-fixtures': {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 120000 // 120 seconds
      }
    }
  }
};

// Create queues
const queues = {};
Object.keys(queueConfigs).forEach(queueName => {
  queues[queueName] = new Queue(queueName, {
    connection: redis,
    ...queueConfigs[queueName]
  });
});

// Worker configurations
const workerConfigs = {
  'live-fixtures': {
    concurrency: 1,
    removeOnComplete: 100,
    removeOnFail: 50
  },
  'upcoming-fixtures': {
    concurrency: 1,
    removeOnComplete: 100,
    removeOnFail: 50
  },
  'completed-fixtures': {
    concurrency: 1,
    removeOnComplete: 100,
    removeOnFail: 50
  }
};

module.exports = {
  redis,
  queues,
  workerConfigs,
  createQueue: (name) => new Queue(name, { connection: redis }),
  createWorker: (name, processor, options = {}) => 
    new Worker(name, processor, { 
      connection: redis, 
      ...workerConfigs[name],
      ...options 
    })
};
