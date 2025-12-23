// Queue system using BullMQ for background job processing
const Queue = require('bull');
const Redis = require('redis');
const { logger } = require('../middleware/logging');

class QueueService {
  constructor() {
    this.queues = new Map();
    this.processors = new Map();
    this.redisClient = null;
    this.redisEnabled = process.env.REDIS_URL ? true : false;

    if (this.redisEnabled) {
      this.redisClient = Redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            // Exponential backoff strategy
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.redisClient.on('error', (error) => {
        // Only log Redis errors in production, or if explicitly configured to log
        if (process.env.NODE_ENV === 'production' || process.env.LOG_REDIS_ERRORS === 'true') {
          logger.error('Redis client error in QueueService:', { error: error.message });
        }
        this.redisEnabled = false;
      });

      this.redisClient.connect().catch(err => {
        // Only log Redis connection errors in production
        if (process.env.NODE_ENV === 'production' || process.env.LOG_REDIS_ERRORS === 'true') {
          logger.error('Redis connection error in QueueService:', { error: err.message });
        }
        this.redisEnabled = false;
      });
    } else {
      logger.info('Redis not configured, using in-memory queues. This is not recommended for production.');
    }
  }

  // Create a new queue
  createQueue(queueName, options = {}) {
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName);
    }

    const queueOptions = {
      limiter: {
        max: 100, // Max jobs per interval
        duration: 30000, // Per 30 seconds
      },
      ...options
    };

    const queue = this.redisEnabled 
      ? new Queue(queueName, process.env.REDIS_URL, queueOptions)
      : new Queue(queueName, queueOptions); // This will use in-memory when Redis is not available

    this.queues.set(queueName, queue);
    return queue;
  }

  // Get an existing queue
  getQueue(queueName) {
    return this.queues.get(queueName);
  }

  // Process jobs for a queue
  processQueue(queueName, processor, concurrency = 1) {
    if (!this.queues.has(queueName)) {
      throw new Error(`Queue ${queueName} does not exist. Create it first.`);
    }

    const queue = this.queues.get(queueName);
    
    // Store the processor function for this queue
    this.processors.set(queueName, processor);

    return queue.process(concurrency, async (job) => {
      try {
        logger.info(`Processing job in queue ${queueName}`, {
          jobId: job.id,
          jobName: job.name,
          data: job.data,
          queue: queueName
        });

        const result = await processor(job.data, job);

        logger.info(`Job ${job.id} in queue ${queueName} completed successfully`, { result });
        return result;
      } catch (error) {
        logger.error(`Job ${job.id} in queue ${queueName} failed`, {
          error: error.message,
          jobId: job.id,
          jobName: job.name,
          data: job.data
        });
        
        // Re-throw to let Bull handle retry logic
        throw error;
      }
    });
  }

  // Add a job to a queue
  async addJob(queueName, jobName, data, options = {}) {
    if (!this.queues.has(queueName)) {
      this.createQueue(queueName);
    }

    const queue = this.queues.get(queueName);
    
    const defaultOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      timeout: 60000,
    };

    const jobOptions = { ...defaultOptions, ...options };

    const job = await queue.add(jobName, data, jobOptions);
    
    logger.info(`Job added to queue ${queueName}`, {
      jobId: job.id,
      jobName,
      data,
      queue: queueName
    });

    return job;
  }

  // Get job by ID
  async getJob(queueName, jobId) {
    if (!this.queues.has(queueName)) {
      throw new Error(`Queue ${queueName} does not exist.`);
    }

    const queue = this.queues.get(queueName);
    return await queue.getJob(jobId);
  }

  // Get queue statistics
  async getQueueStats(queueName) {
    if (!this.queues.has(queueName)) {
      throw new Error(`Queue ${queueName} does not exist.`);
    }

    const queue = this.queues.get(queueName);
    
    const stats = {
      waiting: await queue.getWaitingCount(),
      active: await queue.getActiveCount(),
      completed: await queue.getCompletedCount(),
      failed: await queue.getFailedCount(),
      delayed: await queue.getDelayedCount(),
    };
    
    return stats;
  }

  // Gracefully shutdown all queues
  async shutdown() {
    logger.info('Shutting down queue service...');

    for (const [queueName, queue] of this.queues) {
      try {
        await queue.close();
        logger.info(`Queue ${queueName} closed`);
      } catch (error) {
        logger.error(`Error closing queue ${queueName}:`, { error: error.message });
      }
    }

    if (this.redisClient) {
      await this.redisClient.quit();
    }

    logger.info('Queue service shutdown completed');
  }
}

// Export a singleton instance
const queueService = new QueueService();

module.exports = {
  queueService,
  QueueService
};