# Background Job Queue Implementation with BullMQ

## Overview
This document outlines the implementation of a robust background job queue system using BullMQ for the ContraLock platform. This replaces the current node-cron approach with a more reliable, scalable, and durable solution.

## Why BullMQ?

### Advantages over node-cron:
- **Durability**: Jobs persist even if the server restarts
- **Retries**: Automatic retry with exponential backoff
- **Rate Limiting**: Built-in rate limiting capabilities
- **Monitoring**: Comprehensive dashboard and metrics
- **Scalability**: Multiple workers can process jobs
- **Error Handling**: Better error tracking and handling
- **Priority**: Support for job prioritization
- **Scheduling**: More flexible scheduling options

## Technical Implementation

### 1. Installation and Setup

**Install Dependencies**:
```bash
cd apps/api
npm install bullmq ioredis
npm install --save-dev @types/bullmq  # if using TypeScript
```

**Redis Configuration** (apps/api/src/config/redis.js):
```javascript
const Redis = require('ioredis');

// Redis connection configuration
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryDelayOnFailover: 100,
  maxLoadingTimeout: 5000,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 30000,
  disconnectTimeout: 10000,
  lazyConnect: true,
  // Add additional configuration based on Redis setup
};

if (process.env.REDIS_TLS === 'true') {
  redisOptions.tls = {
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  };
}

// Create Redis instance
const redis = new Redis(redisOptions);

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Successfully connected to Redis');
});

redis.on('ready', () => {
  console.log('Redis is ready to use');
});

module.exports = redis;
```

### 2. Queue Manager Service

**Queue Manager** (apps/api/src/services/queueService.js):
```javascript
const { Queue, Worker, QueueEvents, Job } = require('bullmq');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class QueueService {
  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.queueEvents = new Map();
  }

  /**
   * Create a new queue
   * @param {string} queueName - Name of the queue
   * @param {number} concurrency - Number of concurrent jobs to process
   * @param {function} processor - Function to process jobs
   * @returns {Queue} The created queue instance
   */
  createQueue(queueName, concurrency = 1, processor = null) {
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName);
    }

    const queue = new Queue(queueName, {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    this.queues.set(queueName, queue);

    // Set up event listeners
    this.setupQueueEvents(queue, queueName);

    // Start worker if processor is provided
    if (processor) {
      this.createWorker(queueName, concurrency, processor);
    }

    return queue;
  }

  /**
   * Create a worker for a queue
   * @param {string} queueName - Name of the queue
   * @param {number} concurrency - Number of concurrent jobs to process
   * @param {function} processor - Function to process jobs
   */
  createWorker(queueName, concurrency, processor) {
    if (this.workers.has(queueName)) {
      return this.workers.get(queueName);
    }

    const worker = new Worker(queueName, async (job) => {
      try {
        logger.info(`Processing job ${job.id} in queue ${queueName}`, {
          queue: queueName,
          jobData: job.data,
          jobId: job.id,
        });
        
        // Process the job with the provided processor
        const result = await processor(job);
        
        logger.info(`Successfully processed job ${job.id} in queue ${queueName}`, {
          queue: queueName,
          jobId: job.id,
        });
        
        return result;
      } catch (error) {
        logger.error(`Error processing job ${job.id} in queue ${queueName}: ${error.message}`, {
          queue: queueName,
          jobId: job.id,
          error: error,
          jobData: job.data,
        });
        
        throw error;
      }
    }, {
      connection: redis,
      concurrency: concurrency,
    });

    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed in queue ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed in queue ${queueName}: ${err.message}`, {
        jobId: job.id,
        queue: queueName,
        error: err,
      });
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  /**
   * Setup queue events listener
   * @param {Queue} queue - Queue instance
   * @param {string} queueName - Name of the queue
   */
  setupQueueEvents(queue, queueName) {
    const queueEvents = new QueueEvents(queueName, { connection: redis });
    
    queueEvents.on('waiting', (jobId) => {
      logger.debug(`Job ${jobId} is waiting in queue ${queueName}`);
    });
    
    queueEvents.on('active', (jobId) => {
      logger.debug(`Job ${jobId} is active in queue ${queueName}`);
    });
    
    queueEvents.on('completed', (job) => {
      logger.debug(`Job ${job.jobId} completed in queue ${queueName}`);
    });
    
    queueEvents.on('failed', (job) => {
      logger.error(`Job ${job.jobId} failed in queue ${queueName}`, job.failedReason);
    });

    this.queueEvents.set(queueName, queueEvents);
  }

  /**
   * Get a specific queue
   * @param {string} queueName - Name of the queue
   * @returns {Queue} The queue instance
   */
  getQueue(queueName) {
    return this.queues.get(queueName);
  }

  /**
   * Add a job to a queue
   * @param {string} queueName - Name of the queue
   * @param {string} jobName - Name of the job
   * @param {object} data - Job data
   * @param {object} options - Job options
   * @returns {Job} The created job
   */
  async addJob(queueName, jobName, data, options = {}) {
    const queue = this.getQueue(queueName);
    
    if (!queue) {
      throw new Error(`Queue ${queueName} does not exist`);
    }

    const job = await queue.add(jobName, data, options);
    
    logger.info(`Job ${job.id} added to queue ${queueName}`, {
      jobName,
      queue: queueName,
      jobId: job.id,
      jobData: data,
    });

    return job;
  }

  /**
   * Close all queues and workers
   */
  async close() {
    for (const [queueName, queue] of this.queues) {
      await queue.close();
    }
    
    for (const [queueName, worker] of this.workers) {
      await worker.close();
    }
    
    for (const [queueName, queueEvents] of this.queueEvents) {
      await queueEvents.close();
    }

    await redis.quit();
  }
}

// Create singleton instance
const queueService = new QueueService();

module.exports = queueService;
```

### 3. Job Definitions

**Email Job** (apps/api/src/jobs/emailJob.js):
```javascript
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Email job processor
const emailJobProcessor = async (job) => {
  const { to, subject, template, data } = job.data;
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Define email templates
    const templates = {
      welcome: {
        subject: 'Welcome to Delivault!',
        html: `<h1>Welcome ${data.firstName}!</h1><p>Thank you for joining Delivault. We're excited to have you on board.</p>`,
      },
      paymentConfirmation: {
        subject: 'Payment Confirmation',
        html: `<h2>Payment Confirmation</h2><p>Hi ${data.firstName},</p><p>Your payment of $${data.amount} has been successfully completed.</p><p>Transaction ID: ${data.transactionId}</p>`,
      },
      milestoneNotification: {
        subject: 'Milestone Update',
        html: `<h2>Milestone Update</h2><p>Hi ${data.firstName},</p><p>The milestone "${data.milestoneTitle}" has been updated to status: ${data.milestoneStatus}.</p>`,
      },
      disputeNotification: {
        subject: 'Dispute Resolution Update',
        html: `<h2>Dispute Update</h2><p>Hi ${data.firstName},</p><p>The dispute for project "${data.projectTitle}" has been updated.</p><p>Status: ${data.disputeStatus}</p>`,
      },
    };

    const emailTemplate = templates[template];
    
    if (!emailTemplate) {
      throw new Error(`Email template "${template}" not found`);
    }

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@delivault.com',
      to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    logger.info(`Email sent successfully to ${to}`, { messageId: info.messageId });
    
    return { messageId: info.messageId, email: to };
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`, { error });
    throw error;
  }
};

module.exports = { emailJobProcessor };
```

**Payment Job** (apps/api/src/jobs/paymentJob.js):
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

// Payment job processor
const paymentJobProcessor = async (job) => {
  const { action, paymentIntentId, amount, currency, projectId, milestoneId, userId, description } = job.data;
  
  try {
    switch (action) {
      case 'process_deposit':
        return await processDeposit(paymentIntentId, amount, currency, projectId, userId, description);
      
      case 'process_release':
        return await processRelease(paymentIntentId, amount, projectId, milestoneId, userId, description);
      
      case 'process_withdrawal':
        return await processWithdrawal(paymentIntentId, amount, userId, description);
      
      case 'create_refund':
        return await createRefund(paymentIntentId, amount, description);
      
      default:
        throw new Error(`Unknown payment action: ${action}`);
    }
  } catch (error) {
    logger.error(`Payment job failed: ${error.message}`, { 
      action, 
      paymentIntentId, 
      error 
    });
    throw error;
  }
};

// Process deposit to escrow
async function processDeposit(paymentIntentId, amount, currency, projectId, userId, description) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status !== 'succeeded') {
    throw new Error(`Payment intent ${paymentIntentId} is not succeeded, status: ${paymentIntent.status}`);
  }

  // Process the deposit in your system
  // Update escrow account, create transaction record, etc.
  
  logger.info(`Deposit processed successfully`, {
    paymentIntentId,
    amount,
    projectId,
    userId
  });

  return { status: 'succeeded', paymentIntentId, amount, projectId, userId };
}

// Process milestone payment release
async function processRelease(paymentIntentId, amount, projectId, milestoneId, userId, description) {
  // Verify the payment exists and is in escrow
  // Create a transfer to the freelancer
  const transfer = await stripe.transfers.create({
    amount: amount * 100, // Stripe uses cents
    currency: currency || 'usd',
    destination: 'acct_' + userId, // This would be the connected account ID
    transfer_group: `project_${projectId}_milestone_${milestoneId}`,
  });

  logger.info(`Payment release processed successfully`, {
    transferId: transfer.id,
    paymentIntentId,
    amount,
    projectId,
    milestoneId,
    userId
  });

  return { status: 'succeeded', transferId: transfer.id, paymentIntentId, amount, projectId, milestoneId, userId };
}

// Process withdrawal request
async function processWithdrawal(paymentIntentId, amount, userId, description) {
  // Create a payout to the user's connected account
  const payout = await stripe.payouts.create({
    amount: amount * 100, // Stripe uses cents
    currency: 'usd',
    destination: 'ba_' + userId, // This would be the connected account bank account ID
  });

  logger.info(`Withdrawal processed successfully`, {
    payoutId: payout.id,
    paymentIntentId,
    amount,
    userId
  });

  return { status: 'succeeded', payoutId: payout.id, paymentIntentId, amount, userId };
}

// Create refund
async function createRefund(paymentIntentId, amount, description) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? amount * 100 : null, // Full refund if no amount specified
    reason: 'requested_by_customer',
    metadata: { description },
  });

  logger.info(`Refund created successfully`, {
    refundId: refund.id,
    paymentIntentId,
    amount
  });

  return { status: 'succeeded', refundId: refund.id, paymentIntentId, amount };
}

module.exports = { paymentJobProcessor };
```

**Invoice Job** (apps/api/src/jobs/invoiceJob.js):
```javascript
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

// Invoice job processor
const invoiceJobProcessor = async (job) => {
  const { projectId, milestoneId, userId, invoiceData } = job.data;
  
  try {
    // Generate invoice PDF
    logger.info(`Generating invoice for project ${projectId}, milestone ${milestoneId}`);
    
    // In a real implementation, you would generate a PDF invoice
    // For this example, we'll just create a placeholder
    const invoicePath = path.join(__dirname, '../../data/invoices', `invoice_${projectId}_${milestoneId}.pdf`);
    
    // Create invoice content (this would be a real PDF generation in production)
    const invoiceContent = generateInvoicePDF(invoiceData);
    
    // Write the PDF to file system
    await fs.writeFile(invoicePath, invoiceContent);
    
    logger.info(`Invoice generated successfully at ${invoicePath}`, {
      projectId,
      milestoneId,
      userId,
      invoicePath
    });
    
    return { status: 'succeeded', invoicePath, projectId, milestoneId, userId };
  } catch (error) {
    logger.error(`Failed to generate invoice: ${error.message}`, { error });
    throw error;
  }
};

// Mock PDF generation function
function generateInvoicePDF(invoiceData) {
  // In a real implementation, you would use a PDF generation library like puppeteer or pdfkit
  // For this example, we'll return mock data
  return Buffer.from(`Invoice for Project: ${invoiceData.projectTitle}\nClient: ${invoiceData.clientName}\nAmount: $${invoiceData.amount}\nGenerated at: ${new Date().toISOString()}`);
}

module.exports = { invoiceJobProcessor };
```

### 4. Queue Initialization

**Queue Initialization** (apps/api/src/services/initializeQueues.js):
```javascript
const queueService = require('./queueService');
const { emailJobProcessor } = require('../jobs/emailJob');
const { paymentJobProcessor } = require('../jobs/paymentJob');
const { invoiceJobProcessor } = require('../jobs/invoiceJob');
const logger = require('../utils/logger');

class QueueInitializer {
  static async initializeQueues() {
    try {
      // Create email queue with 3 concurrent workers
      queueService.createQueue('email', 3, emailJobProcessor);
      logger.info('Email queue initialized with 3 concurrent workers');

      // Create payment queue with 2 concurrent workers
      queueService.createQueue('payment', 2, paymentJobProcessor);
      logger.info('Payment queue initialized with 2 concurrent workers');

      // Create invoice queue with 2 concurrent workers
      queueService.createQueue('invoice', 2, invoiceJobProcessor);
      logger.info('Invoice queue initialized with 2 concurrent workers');

      // Create general processing queue with 1 worker
      queueService.createQueue('general', 1, async (job) => {
        // Process general background tasks
        logger.info(`Processing general job: ${job.name}`, { data: job.data });
        
        // Implement general processing logic here
        switch (job.name) {
          case 'clean-stale-sessions':
            return await cleanStaleSessions();
          case 'archive-old-data':
            return await archiveOldData();
          case 'send-reminders':
            return await sendReminders();
          default:
            throw new Error(`Unknown general job: ${job.name}`);
        }
      });
      logger.info('General queue initialized with 1 concurrent worker');

      logger.info('All queues initialized successfully');
    } catch (error) {
      logger.error('Error initializing queues:', error);
      throw error;
    }
  }
}

// Helper functions for general tasks
async function cleanStaleSessions() {
  // Implementation to clean up expired sessions
  logger.info('Cleaning stale sessions...');
  return { status: 'completed', task: 'clean-stale-sessions' };
}

async function archiveOldData() {
  // Implementation to archive old data
  logger.info('Archiving old data...');
  return { status: 'completed', task: 'archive-old-data' };
}

async function sendReminders() {
  // Implementation to send various reminders
  logger.info('Sending reminders...');
  return { status: 'completed', task: 'send-reminders' };
}

module.exports = QueueInitializer;
```

### 5. Queue Usage in Controllers

**Example Controller Usage** (apps/api/src/controllers/userController.js):
```javascript
const queueService = require('../services/queueService');
const User = require('../models/User');

const UserController = {
  // Register user controller - now sends welcome email via queue
  async register(req, res) {
    try {
      // Create user (existing logic)
      const { email, password, firstName, lastName, role } = req.body;
      
      const user = await User.create({
        email,
        password, // should be hashed
        firstName,
        lastName,
        role
      });

      // Add welcome email to queue (non-blocking)
      await queueService.addJob('email', 'welcome_email', {
        to: user.email,
        subject: 'Welcome to Delivault!',
        template: 'welcome',
        data: {
          firstName: user.firstName,
          email: user.email
        }
      });

      res.status(201).json({
        message: 'User created successfully',
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Payment controller example
  async processPayment(req, res) {
    try {
      const { amount, projectId, milestoneId, userId, description } = req.body;

      // Validate payment details (existing logic)

      // Add payment processing job to queue
      const job = await queueService.addJob('payment', 'process_deposit', {
        action: 'process_deposit',
        amount,
        currency: 'usd',
        projectId,
        userId,
        description
      });

      res.status(200).json({
        message: 'Payment processing started',
        jobId: job.id,
        paymentIntentId: job.data.paymentIntentId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = UserController;
```

### 6. Queue Monitoring and Management

**Queue Admin Controller** (apps/api/src/controllers/queueAdminController.js):
```javascript
const queueService = require('../services/queueService');
const { Queue } = require('bullmq');
const redis = require('../config/redis');

const QueueAdminController = {
  // Get queue status
  async getQueueStatus(req, res) {
    try {
      const queueNames = Array.from(queueService.queues.keys());
      const status = {};

      for (const queueName of queueNames) {
        const queue = queueService.getQueue(queueName);

        const waiting = await queue.getWaitingCount();
        const active = await queue.getActiveCount();
        const completed = await queue.getCompletedCount();
        const failed = await queue.getFailedCount();
        const delayed = await queue.getDelayedCount();

        status[queueName] = {
          waiting,
          active,
          completed,
          failed,
          delayed,
        };
      }

      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Retry failed job
  async retryJob(req, res) {
    try {
      const { queueName, jobId } = req.params;

      const queue = queueService.getQueue(queueName);
      if (!queue) {
        return res.status(404).json({ error: `Queue ${queueName} not found` });
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: `Job ${jobId} not found` });
      }

      if (job.finishedOn) {
        await job.retry();
        res.json({ message: `Job ${jobId} retried successfully` });
      } else {
        res.status(400).json({ error: `Job ${jobId} is not in failed state` });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get job details
  async getJobDetails(req, res) {
    try {
      const { queueName, jobId } = req.params;

      const queue = queueService.getQueue(queueName);
      if (!queue) {
        return res.status(404).json({ error: `Queue ${queueName} not found` });
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: `Job ${jobId} not found` });
      }

      res.json({
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        timestamp: job.timestamp,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        returnvalue: job.returnvalue,
        parentKey: job.parentKey,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = QueueAdminController;
```

### 7. Queue Configuration and Environment Variables

**Updated Environment Variables** (apps/api/.env):
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# Queue Configuration
QUEUE_DEFAULT_CONCURRENCY=2
QUEUE_EMAIL_CONCURRENCY=3
QUEUE_PAYMENT_CONCURRENCY=2
QUEUE_RETRY_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=2000
QUEUE_REMOVE_ON_COMPLETE=100
QUEUE_REMOVE_ON_FAIL=50
```

### 8. Testing

**Queue Service Tests** (apps/api/tests/unit/queueService.test.js):
```javascript
const queueService = require('../../src/services/queueService');
const { afterEach } = require('@jest/globals');

describe('Queue Service', () => {
  afterEach(async () => {
    // Clean up queues after each test
    for (const [name, queue] of queueService.queues) {
      await queue.obliterate({ force: true });
    }
  });

  test('should create a queue successfully', () => {
    const queue = queueService.createQueue('test-queue');
    
    expect(queue).toBeDefined();
    expect(queue.name).toBe('test-queue');
  });

  test('should add a job to queue', async () => {
    const queue = queueService.createQueue('test-job-queue');
    
    const job = await queueService.addJob('test-job-queue', 'test-job', { testData: 'value' });
    
    expect(job).toBeDefined();
    expect(job.data.testData).toBe('value');
  });

  test('should process jobs with provided processor', async () => {
    let processed = false;
    
    // Create a queue with a simple processor
    queueService.createQueue('test-processor-queue', 1, async (job) => {
      processed = true;
      return { result: 'processed' };
    });
    
    const job = await queueService.addJob('test-processor-queue', 'test-process', { value: 'test' });
    
    // Wait a bit for the job to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(processed).toBe(true);
  });
});
```

### 9. Deployment Considerations

**Docker Compose for Redis** (docker-compose.yml):
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

  api:
    build: ./apps/api
    ports:
      - "3001:3001"
    depends_on:
      - redis
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379

volumes:
  redis_data:
```

## Migration Plan

### Phase 1: Setup and Configuration (Day 1-2)
1. Install BullMQ and Redis dependencies
2. Set up Redis connection
3. Create queue service
4. Create job processors
5. Add to application startup

### Phase 2: Migration of Cron Jobs (Day 3-4)
1. Identify all current cron jobs
2. Convert to queue jobs
3. Test new implementations
4. Gradually replace cron jobs

### Phase 3: Integration with Controllers (Day 5-7)
1. Update existing controllers to use queues
2. Test all integration points
3. Add queue monitoring endpoints
4. Implement error handling

### Phase 4: Production Deployment (Day 8-10)
1. Deploy with Redis in production
2. Monitor queue performance
3. Set up alerts for queue failures
4. Verify all background tasks working properly

## Monitoring and Observability

### Dashboard Setup
1. Use Bull Dashboard for queue monitoring
2. Set up custom metrics in application monitoring
3. Create alerts for queue backlogs
4. Monitor job success/failure rates

### Metrics to Track
- Queue length
- Job processing time
- Success/failure rates
- Retry rates
- Worker utilization

This implementation provides a robust, scalable, and reliable background job system that will handle the platform's email, payment, and other background processing needs with proper durability and error handling.