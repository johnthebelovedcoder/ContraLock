// Payment queue for processing payment-related jobs
const { queueService } = require('./index');
const { Transaction } = require('../db/sequelizeModels');
const { logger } = require('../middleware/logging');

class PaymentQueue {
  constructor() {
    this.paymentQueue = queueService.createQueue('payment');
    
    // Start processing payment jobs
    queueService.processQueue('payment', this.processPayment.bind(this), 3); // 3 concurrent payment processors
  }

  // Process payment job
  async processPayment(jobData) {
    const { type, amount, userId, projectId, metadata } = jobData;
    
    logger.info('Processing payment job', {
      type,
      amount,
      userId,
      projectId,
      metadata
    });

    try {
      // Create transaction record
      const transaction = await Transaction.create({
        type: type,
        amount: amount,
        from: userId, // Assuming this is the payer
        projectId: projectId,
        status: 'PENDING',
        provider: 'stripe', // Default provider
        description: `Payment processing for ${type}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Note: In a real implementation, you would call actual payment provider APIs here
      // For now, we'll simulate a successful payment
      
      // Update transaction status to completed
      await transaction.update({ 
        status: 'COMPLETED', 
        processedAt: new Date() 
      });

      logger.info('Payment processed successfully', {
        transactionId: transaction._id,
        amount: transaction.amount,
        status: transaction.status
      });

      return {
        transactionId: transaction._id,
        status: transaction.status,
        amount: transaction.amount,
        processedAt: transaction.processedAt
      };
    } catch (error) {
      logger.error('Payment processing failed', {
        error: error.message,
        type,
        amount,
        userId,
        projectId
      });

      // Update transaction status to failed
      const transaction = await Transaction.create({
        type: type,
        amount: amount,
        from: userId,
        projectId: projectId,
        status: 'FAILED',
        provider: 'stripe',
        description: `Payment failed: ${error.message}`,
        failureReason: error.message,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      throw error;
    }
  }

  // Add a payment processing job to the queue
  async processPaymentJob(type, amount, userId, projectId, metadata = {}) {
    const jobData = { type, amount, userId, projectId, metadata };
    
    return await queueService.addJob('payment', 'process-payment', jobData, {
      priority: 'high',
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: { age: 24 * 3600 }, // Remove after 24 hours
    });
  }

  // Process escrow release
  async processEscrowRelease(amount, projectId, milestoneId, toUserId, fromUserId) {
    const jobData = {
      type: 'MILESTONE_RELEASE',
      amount,
      projectId,
      milestoneId,
      toUserId,
      fromUserId,
      metadata: {
        description: 'Escrow release for milestone completion'
      }
    };

    return await queueService.addJob('payment', 'process-escrow-release', jobData, {
      priority: 'high',
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  // Process dispute resolution payment
  async processDisputeResolution(amount, projectId, disputeId, toUserId, fromUserId, resolutionDetails) {
    const jobData = {
      type: 'DISPUTE_PAYMENT',
      amount,
      projectId,
      disputeId,
      toUserId,
      fromUserId,
      metadata: {
        description: 'Dispute resolution payment',
        resolutionDetails
      }
    };

    return await queueService.addJob('payment', 'process-dispute-payment', jobData, {
      priority: 'high',
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}

module.exports = new PaymentQueue();