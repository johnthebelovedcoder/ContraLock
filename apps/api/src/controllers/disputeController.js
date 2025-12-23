const Dispute = require('../models/Dispute');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } = require('../errors/AppError');
const stripeService = require('../services/paymentService');
const { processAIAnalysis } = require('../services/aiService');
const contentModerationService = require('../services/contentModerationService');
const { notifyProject } = require('../socket/server');
const { Op } = require('sequelize');

// Get disputes for a user
const getUserDisputes = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status, limit = 20, offset = 0 } = req.query;

    const whereConditions = {
      [Op.or]: [
        { 'raisedBy': userId },
        { 'project.client': userId },
        { 'project.freelancer': userId }
      ]
    };

    if (status) {
      whereConditions.status = status;
    }

    const disputes = await Dispute.find({
      where: whereConditions,
      order: [['createdAt', 'DESC']], // Sequelize format for ordering
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Populate related data manually
    const populatedDisputes = await Dispute.populate(disputes, [
      { path: 'project', select: 'title budget' },
      { path: 'milestone', select: 'title amount' },
      { path: 'raisedBy', select: 'firstName lastName email' },
      { path: 'mediator', select: 'firstName lastName' },
      { path: 'arbitrator', select: 'firstName lastName' }
    ]);

    const total = await Dispute.count({ where: whereConditions });

    res.json({
      items: populatedDisputes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get dispute details
const getDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Populate related data manually
    const populatedDispute = await Dispute.populate([dispute], [
      { path: 'project', select: 'title budget client freelancer' },
      { path: 'milestone', select: 'title description amount status' },
      { path: 'raisedBy', select: 'firstName lastName email' },
      { path: 'mediator', select: 'firstName lastName' },
      { path: 'arbitrator', select: 'firstName lastName' }
    ]);

    const disputeWithPopulatedData = populatedDispute[0];
    if (!disputeWithPopulatedData) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Verify user is part of the project
    const project = await Project.findById(disputeWithPopulatedData.project);
    if (!project || (project.client.toString() !== userId && project.freelancer.toString() !== userId)) {
      return next(new ForbiddenError('Not authorized to view this dispute'));
    }

    res.json(disputeWithPopulatedData);
  } catch (error) {
    next(error);
  }
};

// Create a dispute
const createDispute = async (req, res, next) => {
  try {
    const { projectId, milestoneId, reason, evidence = [] } = req.body;
    const userId = req.user.userId;

    // Verify user is part of the project
    const project = await Project.findById(projectId);
    if (!project || (project.client.toString() !== userId && project.freelancer.toString() !== userId)) {
      return next(new ForbiddenError('Not authorized to dispute this project'));
    }

    // Verify milestone belongs to project
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone || milestone.project.toString() !== projectId) {
      return next(new NotFoundError('Milestone not found in project'));
    }

    // Check if dispute already exists for this milestone
    const existingDispute = await Dispute.findOne({
      project: projectId,
      milestone: milestoneId
    });

    if (existingDispute) {
      return next(new BadRequestError('A dispute already exists for this milestone'));
    }

    // Moderate dispute content before creation
    const moderationResult = await contentModerationService.moderateDispute({
      _id: null,
      reason,
      evidence
    });

    if (!moderationResult.isApproved) {
      return next(new BadRequestError(`Dispute content flagged: ${moderationResult.message}`));
    }

    // Create dispute
    const dispute = new Dispute({
      project: projectId,
      milestone: milestoneId,
      raisedBy: userId,
      reason,
      evidence: evidence.map(item => ({
        filename: item.filename,
        url: item.url,
        type: item.type || 'file',
        uploadedBy: userId
      })),
      status: 'PENDING_REVIEW',
      resolutionPhase: 'AUTO_REVIEW'
    });

    await dispute.save();

    // Update milestone status
    milestone.status = 'DISPUTED';
    await milestone.save();

    // Update project status to disputed
    project.status = 'DISPUTED';
    await project.save();

    // Process with AI for initial analysis if auto-review is enabled
    try {
      const aiAnalysis = await processAIAnalysis({
        projectAgreement: project.description,
        disputeDescription: reason,
        milestoneDetails: milestone.toObject(),
        evidence: evidence.map(e => e.url || e.filename).join(', ')
      });

      dispute.aiAnalysis = aiAnalysis;
      dispute.status = 'IN_MEDIATION'; // Move to mediation after AI review
      dispute.resolutionPhase = 'MEDIATION';
      
      await dispute.save();
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      // Continue without AI analysis if it fails
      dispute.status = 'IN_MEDIATION';
      await dispute.save();
    }

    // Add to project activity log
    project.activityLog.push({
      action: 'DISPUTE_RAISED',
      performedBy: userId,
      details: {
        milestoneId: milestoneId,
        disputeId: dispute._id,
        reason: reason
      }
    });
    await project.save();

    // Notify project participants
    notifyProject(projectId, 'dispute-raised', {
      disputeId: dispute._id,
      milestoneId,
      raisedBy: userId,
      timestamp: new Date(),
      message: `Dispute raised for milestone "${milestone.title}"`
    });

    res.status(201).json(dispute);
  } catch (error) {
    next(error);
  }
};

// Add a message to a dispute
const addDisputeMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Verify user is part of the dispute
    const project = await Project.findById(dispute.project);
    if (!project || (project.client.toString() !== userId && project.freelancer.toString() !== userId)) {
      return next(new ForbiddenError('Not authorized to participate in this dispute'));
    }

    // Add message
    if (!dispute.messages) {
      dispute.messages = [];
    }
    
    dispute.messages.push({
      sender: userId,
      content,
      sentAt: new Date()
    });

    await dispute.save();

    // Notify project participants
    notifyProject(dispute.project.toString(), 'dispute-message', {
      disputeId: dispute._id,
      message: {
        sender: userId,
        content,
        sentAt: new Date()
      }
    });

    res.status(201).json({
      message: 'Message added to dispute',
      messageObj: {
        sender: userId,
        content,
        sentAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Move dispute to mediation (admin/arbitrator only)
const moveToMediation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'arbitrator')) {
      return next(new ForbiddenError('Only admins and arbitrators can move disputes to mediation'));
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    if (dispute.status !== 'PENDING_REVIEW' && dispute.status !== 'IN_MEDIATION') {
      return next(new BadRequestError('Dispute cannot be moved to mediation from current status'));
    }

    // Update dispute status
    dispute.status = 'IN_MEDIATION';
    dispute.resolutionPhase = 'MEDIATION';
    dispute.mediator = userId;
    await dispute.save();

    // Add to project activity log
    const project = await Project.findById(dispute.project);
    project.activityLog.push({
      action: 'DISPUTE_MOVED_TO_MEDIATION',
      performedBy: userId,
      details: {
        disputeId: dispute._id,
        mediator: userId
      }
    });
    await project.save();

    res.json({
      message: 'Dispute moved to mediation',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// Assign arbitrator to dispute (admin only)
const assignArbitrator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { arbitratorId } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return next(new ForbiddenError('Only admins can assign arbitrators'));
    }

    // Verify the arbitrator exists and is registered as an arbitrator
    const arbitrator = await User.findById(arbitratorId);
    if (!arbitrator) {
      return next(new NotFoundError('Arbitrator not found'));
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    if (dispute.status !== 'IN_ARBITRATION') {
      // Move to arbitration first if needed
      dispute.status = 'IN_ARBITRATION';
      dispute.resolutionPhase = 'ARBITRATION';
    }
    
    // Assign the arbitrator
    dispute.arbitrator = arbitratorId;
    await dispute.save();

    // Add to project activity log
    const project = await Project.findById(dispute.project);
    project.activityLog.push({
      action: 'ARBITRATOR_ASSIGNED',
      performedBy: userId,
      details: {
        disputeId: dispute._id,
        arbitratorId: arbitratorId
      }
    });
    await project.save();

    res.json({
      message: 'Arbitrator assigned to dispute',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// Resolve dispute (by arbitrator)
const resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, amountToFreelancer, amountToClient, decisionReason } = req.body;
    const userId = req.user.userId;

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Verify user is the assigned arbitrator, or an admin if no arbitrator assigned
    if (dispute.arbitrator && dispute.arbitrator.toString() !== userId) {
      const user = await User.findById(userId);
      if (!user || user.role !== 'admin') {
        return next(new ForbiddenError('Only assigned arbitrator or admin can resolve this dispute'));
      }
    }

    // Verify the amounts match the milestone amount (for partial payments)
    const project = await Project.findById(dispute.project);
    const milestone = await Milestone.findById(dispute.milestone);

    const currency = milestone.currency || project.currency || 'USD';
    // Get the milestone amount in the project's currency units
    const milestoneAmountInCurrencyUnits = milestone.amount;

    // Validate that the total amount to be distributed equals the milestone amount
    // Convert amounts back to currency units for comparison
    let amountToFreelancerInCurrencyUnits, amountToClientInCurrencyUnits;
    switch (currency.toUpperCase()) {
      case 'JPY':
        // JPY has no decimal places
        amountToFreelancerInCurrencyUnits = Math.round(amountToFreelancer);
        amountToClientInCurrencyUnits = Math.round(amountToClient);
        break;
      case 'BTC':
        // BTC uses 8 decimal places (satoshi)
        amountToFreelancerInCurrencyUnits = Math.round(amountToFreelancer * 100000000);
        amountToClientInCurrencyUnits = Math.round(amountToClient * 100000000);
        break;
      case 'ETH':
        // ETH uses 18 decimal places (wei)
        amountToFreelancerInCurrencyUnits = Math.round(amountToFreelancer * 1000000000000000000);
        amountToClientInCurrencyUnits = Math.round(amountToClient * 1000000000000000000);
        break;
      default:
        // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
        amountToFreelancerInCurrencyUnits = Math.round(amountToFreelancer * 100);
        amountToClientInCurrencyUnits = Math.round(amountToClient * 100);
        break;
    }

    if (decision !== 'revision_required' &&
        Math.abs(amountToFreelancerInCurrencyUnits + amountToClientInCurrencyUnits - milestoneAmountInCurrencyUnits) > 0.01) {
      return next(new BadRequestError('Amounts must add up to the milestone amount in the project currency'));
    }

    // Process the resolution
    dispute.resolution = {
      decision,
      amountToFreelancer: amountToFreelancerInCurrencyUnits,
      amountToClient: amountToClientInCurrencyUnits,
      decisionReason,
      decidedBy: userId,
      decidedAt: new Date()
    };
    
    dispute.status = 'RESOLVED';
    await dispute.save();

    // Process payment release/refund if needed
    if (decision !== 'revision_required') {
      // Create transaction record for the resolution
      const transaction = new Transaction({
        projectId: dispute.project,
        disputeId: dispute._id,
        type: decision.includes('payment') ? 'DISPUTE_PAYMENT' : 'DISPUTE_REFUND',
        amount: decision.includes('payment') ? amountToFreelancerInCurrencyUnits : amountToClientInCurrencyUnits,
        from: decision.includes('payment') ? null : project.client, // From escrow if payment, from client if refund
        to: decision.includes('payment') ? project.freelancer : project.client,
        currency: currency,
        status: 'COMPLETED', // For now, mark as completed
        provider: 'stripe',
        providerTransactionId: `disp_${Date.now()}`,
        description: `Dispute resolution: ${decision}`,
        fees: {
          platform: 0, // No platform fee for dispute resolution
          paymentProcessor: 0,
          total: 0
        }
      });

      await transaction.save();

      // Update project escrow status based on resolution
      if (decision.includes('payment')) {
        project.escrow.totalReleased += amountToFreelancerInCurrencyUnits;
        project.escrow.remaining -= amountToFreelancerInCurrencyUnits;
      }
      if (decision === 'full_refund_to_client') {
        project.escrow.remaining = 0; // Clear remaining if full refund
      }

      // Handle the actual payment transfer/refund
      if (decision.includes('payment') && amountToFreelancer > 0) {
        try {
          // Convert amount back to base units for the transfer
          let amountInBaseUnits;
          switch (currency.toUpperCase()) {
            case 'JPY':
              // JPY has no decimal places
              amountInBaseUnits = amountToFreelancer;
              break;
            case 'BTC':
              // BTC uses 8 decimal places (satoshi)
              amountInBaseUnits = amountToFreelancer / 100000000;
              break;
            case 'ETH':
              // ETH uses 18 decimal places (wei)
              amountInBaseUnits = amountToFreelancer / 1000000000000000000;
              break;
            default:
              // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
              amountInBaseUnits = amountToFreelancer / 100;
              break;
          }

          const freelancer = await User.findById(project.freelancer);
          if (freelancer && freelancer.stripeAccountId) {
            await stripeService.transferToFreelancer(
              amountInBaseUnits,
              freelancer.stripeAccountId,
              `Dispute resolution payment for milestone: ${milestone.title}`
            );
          }
        } catch (paymentError) {
          console.error('Dispute resolution payment error:', paymentError);
          transaction.status = 'FAILED';
          await transaction.save();
        }
      }

      if (decision === 'full_refund_to_client' && amountToClient > 0) {
        // In a real system, this would process a refund to the client
        // For now, we'll just note it in the transaction
      }

      // Update milestone status based on resolution
      if (decision !== 'revision_required') {
        milestone.status = decision.includes('payment') ? 'APPROVED' : 'REVISION_REQUESTED';
      }
    } else {
      // If revision is required, set milestone back to submitted for freelancer to update
      milestone.status = 'REVISION_REQUESTED';
    }

    await Promise.all([project.save(), milestone.save()]);

    // Add to project activity log
    project.activityLog.push({
      action: 'DISPUTE_RESOLVED',
      performedBy: userId,
      details: {
        disputeId: dispute._id,
        resolution: dispute.resolution
      }
    });
    await project.save();

    // If all milestones are completed (approved), mark project as completed
    const allMilestones = await Milestone.find({ project: project._id });
    const allMilestonesCompleted = allMilestones.every(m =>
      m.status === 'APPROVED' || m.status === 'DISPUTED' // Disputed milestones are resolved separately
    );

    if (allMilestonesCompleted) {
      project.status = 'COMPLETED';
      await project.save();
    }

    // Notify project participants
    notifyProject(project._id.toString(), 'dispute-resolved', {
      disputeId: dispute._id,
      decision,
      resolvedBy: userId,
      timestamp: new Date(),
      message: `Dispute for milestone "${milestone.title}" has been resolved`
    });

    res.json({
      message: 'Dispute resolved',
      dispute,
      transaction: decision !== 'revision_required' ? transaction : null
    });
  } catch (error) {
    next(error);
  }
};

// Evaluate dispute for escalation to arbitration
const evaluateForArbitration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Only admin, arbitrator, or mediator can evaluate escalation
    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'arbitrator' && user.role !== 'mediator')) {
      return next(new ForbiddenError('Only admin, arbitrator, or mediator can evaluate dispute escalation'));
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Check if dispute should be escalated to arbitration
    let shouldEscalate = false;
    
    // Conditions for escalation
    if (dispute.status === 'IN_MEDIATION' && dispute.resolutionPhase === 'MEDIATION') {
      // If mediation has been ongoing for more than 24 hours without resolution, escalate
      const mediationStart = dispute.mediator && dispute.updatedAt;
      if (mediationStart && (Date.now() - new Date(mediationStart).getTime()) > 24 * 60 * 60 * 1000) {
        shouldEscalate = true;
      }
      
      // If parties cannot reach agreement after multiple mediation messages, escalate
      if (dispute.messages && dispute.messages.length > 10) {
        shouldEscalate = true;
      }
    }

    if (shouldEscalate) {
      dispute.status = 'IN_ARBITRATION';
      dispute.resolutionPhase = 'ARBITRATION';
      await dispute.save();
    }

    res.json({
      message: 'Escalation evaluation completed',
      shouldEscalate,
      dispute
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserDisputes,
  getDispute,
  createDispute,
  addDisputeMessage,
  moveToMediation,
  assignArbitrator,
  resolveDispute,
  evaluateForArbitration
};