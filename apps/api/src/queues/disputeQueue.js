// Dispute queue for processing dispute-related jobs
const { queueService } = require('./index');
const { Dispute, Project, Milestone, User } = require('../db/sequelizeModels');
const { logger } = require('../middleware/logging');

class DisputeQueue {
  constructor() {
    this.disputeQueue = queueService.createQueue('dispute');
    
    // Start processing dispute jobs
    queueService.processQueue('dispute', this.processDisputeJob.bind(this), 2); // 2 concurrent dispute processors
  }

  // Process dispute job
  async processDisputeJob(jobData) {
    const { disputeId, action, metadata } = jobData;
    
    logger.info('Processing dispute job', {
      disputeId,
      action,
      metadata
    });

    try {
      const dispute = await Dispute.findByPk(disputeId);
      if (!dispute) {
        throw new Error(`Dispute with ID ${disputeId} not found`);
      }

      switch (action) {
        case 'auto_review':
          return await this.processAutoReview(dispute, metadata);
        case 'update_status':
          return await this.updateDisputeStatus(dispute, metadata);
        case 'notify_parties':
          return await this.notifyDisputeParties(dispute, metadata);
        case 'ai_analysis':
          return await this.performAIAnalysis(dispute, metadata);
        default:
          throw new Error(`Unknown dispute action: ${action}`);
      }
    } catch (error) {
      logger.error('Dispute processing failed', {
        error: error.message,
        disputeId,
        action,
        metadata
      });
      throw error;
    }
  }

  // Perform auto review of dispute
  async processAutoReview(dispute, metadata) {
    // In a real implementation, this would analyze dispute details, evidence, etc.
    // For now, we'll simulate an auto-review process
    
    logger.info('Performing auto review for dispute', { disputeId: dispute._id });

    // Update dispute with auto-review info
    await dispute.update({
      status: 'IN_MEDIATION',
      resolutionPhase: 'MEDIATION',
      aiAnalysis: JSON.stringify({
        confidenceScore: 0.7,
        keyIssues: ['Missing deliverables', 'Late submission'],
        recommendedResolution: 'Partial refund to client',
        reasoning: 'Based on evidence and project timeline'
      }),
      updatedAt: new Date()
    });

    logger.info('Auto review completed for dispute', { disputeId: dispute._id });

    // Add a job to notify parties
    await queueService.addJob('dispute', 'notify-parties', {
      disputeId: dispute._id,
      action: 'notify_parties',
      metadata: { phase: 'auto_review_completed' }
    });

    return {
      disputeId: dispute._id,
      status: dispute.status,
      phase: dispute.resolutionPhase,
      aiAnalysis: dispute.aiAnalysis
    };
  }

  // Update dispute status
  async updateDisputeStatus(dispute, metadata) {
    const { newStatus, reason } = metadata;
    
    await dispute.update({
      status: newStatus,
      updatedAt: new Date()
    });

    logger.info('Dispute status updated', {
      disputeId: dispute._id,
      newStatus,
      reason
    });

    return {
      disputeId: dispute._id,
      status: newStatus
    };
  }

  // Notify dispute parties
  async notifyDisputeParties(dispute, metadata) {
    logger.info('Notifying dispute parties', { disputeId: dispute._id });

    // Get project and users involved
    const project = await Project.findByPk(dispute.project);
    const raisedByUser = await User.findByPk(dispute.raisedBy);
    
    // In a real implementation, we would send notifications to both parties
    // For now, we'll just log it
    logger.info('Dispute notification sent', {
      disputeId: dispute._id,
      projectTitle: project?.title,
      raisedBy: raisedByUser?.email
    });

    return { disputeId: dispute._id, notification: 'sent' };
  }

  // Perform AI analysis on dispute
  async performAIAnalysis(dispute, metadata) {
    logger.info('Performing AI analysis on dispute', { disputeId: dispute._id });

    // Simulate AI analysis
    const aiAnalysis = {
      confidenceScore: Math.random(), // Random for simulation
      keyIssues: ['Deliverable quality', 'Timeline compliance'],
      recommendedResolution: '50/50 split',
      reasoning: 'Based on evidence analysis and platform policies',
      analysisTimestamp: new Date().toISOString()
    };

    await dispute.update({
      aiAnalysis: JSON.stringify(aiAnalysis),
      resolutionPhase: 'AUTO_REVIEW',
      updatedAt: new Date()
    });

    logger.info('AI analysis completed for dispute', { disputeId: dispute._id });

    return {
      disputeId: dispute._id,
      aiAnalysis
    };
  }

  // Add a dispute processing job to the queue
  async processDispute(disputeId, action, metadata = {}) {
    const jobData = { disputeId, action, metadata };
    
    return await queueService.addJob('dispute', 'process-dispute', jobData, {
      priority: 'high',
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      removeOnFail: { age: 24 * 3600 }, // Remove after 24 hours
    });
  }

  // Process dispute auto-review
  async processDisputeAutoReview(disputeId) {
    return await this.processDispute(disputeId, 'auto_review', {});
  }

  // Process dispute AI analysis
  async processDisputeAIAnalysis(disputeId) {
    return await this.processDispute(disputeId, 'ai_analysis', {});
  }

  // Process dispute notification
  async notifyDispute(disputeId, reason) {
    return await this.processDispute(disputeId, 'notify_parties', { reason });
  }
}

module.exports = new DisputeQueue();