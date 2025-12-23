const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } = require('../errors/AppError');
const stripeService = require('../services/paymentService');
const { processAIAnalysis } = require('../services/aiService');
const contentModerationService = require('../services/contentModerationService');
const { notifyProject } = require('../socket/server');
const { Op } = require('sequelize');

// Get milestones for a project
const getMilestones = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Verify user has access to project
    const project = await Project.findById(projectId);
    if (!project || (project.client.toString() !== userId && project.freelancer.toString() !== userId)) {
      return next(new ForbiddenError('Not authorized to access this project'));
    }

    // Get milestones for the project
    const milestones = await Milestone.find({
      where: { project: projectId },
      order: [['createdAt', 'ASC']] // Sequelize format for ordering
    });

    res.json(milestones);
  } catch (error) {
    next(error);
  }
};

// Get a specific milestone
const getMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const userId = req.user.userId;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return next(new NotFoundError('Milestone not found'));
    }

    // Populate project manually
    const populatedMilestone = await Milestone.populate([milestone], [
      { path: 'project' }
    ]);

    const milestoneWithProject = populatedMilestone[0];
    if (!milestoneWithProject) {
      return next(new NotFoundError('Milestone not found'));
    }

    // Verify user has access to the project containing this milestone
    const project = milestoneWithProject.project;
    if (project.client.toString() !== userId && project.freelancer.toString() !== userId) {
      return next(new ForbiddenError('Not authorized to access this milestone'));
    }

    res.json(milestoneWithProject);
  } catch (error) {
    next(error);
  }
};

// Create a milestone
const createMilestone = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, amount, deadline, acceptanceCriteria, currency } = req.body;
    const userId = req.user.userId;

    // Verify user is the project client (only client can create milestones)
    const project = await Project.findById(projectId);
    if (!project || project.client.toString() !== userId) {
      return next(new ForbiddenError('Only the project client can create milestones'));
    }

    // Validate currency if provided
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BTC', 'ETH']; // Add more as needed
    const milestoneCurrency = currency || project.currency || 'USD';
    if (!supportedCurrencies.includes(milestoneCurrency)) {
      return next(new BadRequestError(`Currency ${milestoneCurrency} is not supported. Supported currencies: ${supportedCurrencies.join(', ')}`));
    }

    // Verify project is in proper state
    if (project.status !== 'DRAFT' && project.status !== 'PENDING_ACCEPTANCE') {
      return next(new BadRequestError('Cannot create milestones after project is active'));
    }

    // Validate amount against remaining budget
    const totalMilestoneBudget = project.milestones.reduce((sum, m) => sum + m.amount, 0);
    const remainingBudget = project.budget - totalMilestoneBudget;

    if (amount > remainingBudget) {
      return next(new BadRequestError(`Amount exceeds remaining budget. Available: $${remainingBudget / 100}`));
    }

    // Moderate milestone content before creation
    const moderationResult = await contentModerationService.moderateMilestone({
      _id: null,
      title,
      description,
      acceptanceCriteria
    });

    if (!moderationResult.isApproved) {
      return next(new BadRequestError(`Milestone content flagged: ${moderationResult.message}`));
    }

    // Create milestone
    const milestone = new Milestone({
      title,
      description,
      amount,
      deadline: new Date(deadline),
      acceptanceCriteria,
      project: projectId,
      currency: milestoneCurrency,
      status: 'PENDING'
    });

    await milestone.save();

    // Add to project milestones
    project.milestones.push(milestone._id);
    await project.save();

    // Add to project activity log
    project.activityLog.push({
      action: 'MILESTONE_CREATED',
      performedBy: userId,
      details: {
        milestoneId: milestone._id,
        title: milestone.title,
        currency: milestoneCurrency
      }
    });
    await project.save();

    res.status(201).json(milestone);
  } catch (error) {
    next(error);
  }
};

// Start working on a milestone (freelancer)
const startMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const userId = req.user.userId;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return next(new NotFoundError('Milestone not found'));
    }

    // Populate project manually
    const populatedMilestone = await Milestone.populate([milestone], [
      { path: 'project' }
    ]);

    const milestoneWithProject = populatedMilestone[0];
    if (!milestoneWithProject) {
      return next(new NotFoundError('Milestone not found'));
    }

    // Verify the freelancer starting is the assigned freelancer
    const project = milestoneWithProject.project;
    if (project.freelancer.toString() !== userId) {
      return next(new ForbiddenError('Only the assigned freelancer can start milestones'));
    }

    // Verify milestone is in proper state
    if (milestone.status !== 'PENDING') {
      return next(new BadRequestError('Milestone must be in PENDING state to start'));
    }

    // Verify project is active
    if (project.status !== 'ACTIVE') {
      return next(new BadRequestError('Cannot start milestones before funds are deposited'));
    }

    // Update milestone status
    milestone.status = 'IN_PROGRESS';
    milestone.startedAt = new Date();
    await milestone.save();

    // Add to project activity log
    project.activityLog.push({
      action: 'MILESTONE_STARTED',
      performedBy: userId,
      details: {
        milestoneId: milestone._id,
        title: milestone.title
      }
    });
    await project.save();

    // Notify project participants
    notifyProject(project._id, 'milestone-started', {
      milestoneId: milestone._id,
      title: milestone.title,
      startedBy: userId,
      timestamp: new Date()
    });

    res.json(milestoneWithProject);
  } catch (error) {
    next(error);
  }
};

// Submit milestone for review (freelancer)
const submitMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const { deliverables, submissionNotes } = req.body;
    const userId = req.user.userId;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return next(new NotFoundError('Milestone not found'));
    }

    // Populate project manually
    const populatedMilestone = await Milestone.populate([milestone], [
      { path: 'project' }
    ]);

    const milestoneWithProject = populatedMilestone[0];
    if (!milestoneWithProject) {
      return next(new NotFoundError('Milestone not found'));
    }

    // Verify the freelancer submitting is the assigned freelancer
    const project = milestoneWithProject.project;
    if (project.freelancer.toString() !== userId) {
      return next(new ForbiddenError('Only the assigned freelancer can submit milestones'));
    }

    // Verify milestone is in proper state
    if (milestone.status !== 'IN_PROGRESS') {
      return next(new BadRequestError('Milestone must be in progress to submit'));
    }

    // Update milestone with submission
    milestone.status = 'SUBMITTED';
    milestone.deliverables = deliverables || [];
    milestone.submissionNotes = submissionNotes;
    milestone.submittedAt = new Date();
    await milestone.save();

    // Add to project activity log
    project.activityLog.push({
      action: 'MILESTONE_SUBMITTED',
      performedBy: userId,
      details: {
        milestoneId: milestone._id,
        title: milestone.title,
        deliverables: deliverables,
        submissionNotes: submissionNotes
      }
    });
    await project.save();

    // Notify client of submission
    notifyProject(project._id, 'milestone-submitted', {
      milestoneId: milestone._id,
      title: milestone.title,
      submittedBy: userId,
      timestamp: new Date()
    });

    res.json(milestoneWithProject);
  } catch (error) {
    next(error);
  }
};

// Approve milestone (client)
const approveMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const userId = req.user.userId;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return next(new NotFoundError('Milestone not found'));
    }

    // Populate project manually
    const populatedMilestone = await Milestone.populate([milestone], [
      { path: 'project' }
    ]);

    const milestoneWithProject = populatedMilestone[0];
    if (!milestoneWithProject) {
      return next(new NotFoundError('Milestone not found'));
    }

    // Verify the client approving is the project client
    const project = milestoneWithProject.project;
    if (project.client.toString() !== userId) {
      return next(new ForbiddenError('Only the client can approve milestones'));
    }

    // Verify milestone is in proper state
    if (milestone.status !== 'SUBMITTED') {
      return next(new BadRequestError('Milestone must be submitted to approve'));
    }

    // Get freelancer to release payment to
    const freelancer = await User.findById(project.freelancer);
    if (!freelancer || !freelancer.stripeAccountId) {
      return next(new BadRequestError('Freelancer does not have a connected account'));
    }

    // Calculate payment amount using split fee model
    // Client paid 1.9% upfront, freelancer pays 3.6% on release
    const projectPaymentSchedule = project.paymentSchedule ? JSON.parse(project.paymentSchedule) : {};
    const freelancerFeePercent = projectPaymentSchedule.freelancerFeePercent || 3.6; // 3.6% from freelancer

    // Convert milestone amount from currency units to base units for calculation
    let amountInBaseUnits;
    let currency = milestone.currency || project.currency || 'USD';
    switch (currency.toUpperCase()) {
      case 'JPY':
        // JPY has no decimal places
        amountInBaseUnits = milestone.amount;
        break;
      case 'BTC':
        // BTC uses 8 decimal places (satoshi)
        amountInBaseUnits = milestone.amount / 100000000;
        break;
      case 'ETH':
        // ETH uses 18 decimal places (wei)
        amountInBaseUnits = milestone.amount / 1000000000000000000;
        break;
      default:
        // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
        amountInBaseUnits = milestone.amount / 100;
    }

    const freelancerFee = amountInBaseUnits * (freelancerFeePercent / 100);
    const netAmount = amountInBaseUnits - freelancerFee; // Amount after freelancer fee

    // Process payment release using Stripe
    try {
      const transfer = await stripeService.transferToFreelancer(
        netAmount,
        freelancer.stripeAccountId,
        `Payment for milestone: ${milestone.title}`
      );

      // Update milestone status
      milestone.status = 'APPROVED';
      milestone.approvedAt = new Date();
      await milestone.save();

      // Update escrow amounts in project
      project.escrow.totalReleased += milestone.amount;
      project.escrow.remaining -= milestone.amount;

      // If all milestones are approved, mark project as completed
      const allMilestonesApproved = project.milestones.every(m => {
        return m.status === 'APPROVED' || m.status === 'DISPUTED';
      });

      if (allMilestonesApproved) {
        project.status = 'COMPLETED';
      }

      await project.save();

      // Create transaction record with split fee model
      // Calculate amounts in appropriate currency units
      let amountInCurrencyUnits, clientFeeInCurrencyUnits, freelancerFeeInCurrencyUnits, totalFeeInCurrencyUnits;
      switch (currency.toUpperCase()) {
        case 'JPY':
          // JPY has no decimal places
          amountInCurrencyUnits = Math.round(netAmount); // Net amount after freelancer fee
          clientFeeInCurrencyUnits = Math.round((milestone.amount) * 0.019); // 1.9% of original amount
          freelancerFeeInCurrencyUnits = Math.round(freelancerFee); // 3.6% of original amount in base units
          totalFeeInCurrencyUnits = Math.round((milestone.amount) * 0.055); // 5.5% total
          break;
        case 'BTC':
          // BTC uses 8 decimal places (satoshi)
          amountInCurrencyUnits = Math.round(netAmount * 100000000); // Net amount in satoshis
          clientFeeInCurrencyUnits = Math.round((milestone.amount / 100000000) * 0.019 * 100000000); // 1.9% in satoshis
          freelancerFeeInCurrencyUnits = Math.round(freelancerFee * 100000000); // 3.6% in satoshis
          totalFeeInCurrencyUnits = Math.round((milestone.amount / 100000000) * 0.055 * 100000000); // 5.5% in satoshis
          break;
        case 'ETH':
          // ETH uses 18 decimal places (wei)
          amountInCurrencyUnits = Math.round(netAmount * 1000000000000000000); // Net amount in wei
          clientFeeInCurrencyUnits = Math.round((milestone.amount / 1000000000000000000) * 0.019 * 1000000000000000000); // 1.9% in wei
          freelancerFeeInCurrencyUnits = Math.round(freelancerFee * 1000000000000000000); // 3.6% in wei
          totalFeeInCurrencyUnits = Math.round((milestone.amount / 1000000000000000000) * 0.055 * 1000000000000000000); // 5.5% in wei
          break;
        default:
          // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
          amountInCurrencyUnits = Math.round(netAmount * 100); // Net amount in cents
          clientFeeInCurrencyUnits = Math.round((milestone.amount / 100) * 0.019 * 100); // 1.9% in cents
          freelancerFeeInCurrencyUnits = Math.round(freelancerFee * 100); // 3.6% in cents
          totalFeeInCurrencyUnits = Math.round((milestone.amount / 100) * 0.055 * 100); // 5.5% in cents
      }

      const transaction = new Transaction({
        projectId: project._id,
        milestoneId: milestone._id,
        type: 'MILESTONE_RELEASE',
        amount: amountInCurrencyUnits, // in appropriate currency units (after freelancer fee)
        from: null, // from escrow
        to: project.freelancer,
        currency: currency,
        status: 'COMPLETED',
        provider: 'stripe',
        providerTransactionId: transfer.id,
        description: `Payment release for milestone "${milestone.title}"`,
        fees: {
          client: clientFeeInCurrencyUnits, // Client fee paid upfront (approx)
          freelancer: freelancerFeeInCurrencyUnits, // 3.6% paid by freelancer on release
          platform: totalFeeInCurrencyUnits, // Total platform fee: 5.5%
          paymentProcessor: 0, // Will be calculated from Stripe response
          total: totalFeeInCurrencyUnits // Total fee: 5.5% of milestone amount
        }
      });

      await transaction.save();

      // Add to project activity log
      project.activityLog.push({
        action: 'MILESTONE_APPROVED',
        performedBy: userId,
        details: {
          milestoneId: milestone._id,
          title: milestone.title,
          amount: Math.round(netAmount * 100),
          transactionId: transaction._id
        }
      });

      await project.save();

      // Notify freelancer of approval and payment
      notifyProject(project._id, 'milestone-approved', {
        milestoneId: milestone._id,
        title: milestone.title,
        approvedBy: userId,
        amount: netAmount,
        timestamp: new Date()
      });

      res.json({
        milestone: milestoneWithProject,
        transaction
      });
    } catch (stripeError) {
      console.error('Stripe transfer error:', stripeError);
      return next(new BadRequestError(`Payment processing failed: ${stripeError.message}`));
    }
  } catch (error) {
    next(error);
  }
};

// Request revision for milestone (client)
const requestRevision = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const { revisionNotes } = req.body;
    const userId = req.user.userId;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return next(new NotFoundError('Milestone not found'));
    }

    // Populate project manually
    const populatedMilestone = await Milestone.populate([milestone], [
      { path: 'project' }
    ]);

    const milestoneWithProject = populatedMilestone[0];
    if (!milestoneWithProject) {
      return next(new NotFoundError('Milestone not found'));
    }

    // Verify the client requesting revision is the project client
    const project = milestoneWithProject.project;
    if (project.client.toString() !== userId) {
      return next(new ForbiddenError('Only the client can request revisions'));
    }

    // Verify milestone is in proper state
    if (milestone.status !== 'SUBMITTED') {
      return next(new BadRequestError('Milestone must be submitted to request revision'));
    }

    // Update milestone with revision request
    milestone.status = 'REVISION_REQUESTED';
    milestone.revisionNotes = revisionNotes;
    milestone.revisionRequestedAt = new Date();

    // Add to revision history
    if (!milestone.revisionHistory) {
      milestone.revisionHistory = [];
    }
    milestone.revisionHistory.push({
      requestedAt: new Date(),
      requestedBy: userId,
      notes: revisionNotes
    });

    await milestone.save();

    // Add to project activity log
    project.activityLog.push({
      action: 'REVISION_REQUESTED',
      performedBy: userId,
      details: {
        milestoneId: milestone._id,
        title: milestone.title,
        revisionNotes: revisionNotes
      }
    });
    await project.save();

    // Notify freelancer of revision request
    notifyProject(project._id, 'revision-requested', {
      milestoneId: milestone._id,
      title: milestone.title,
      requestedBy: userId,
      revisionNotes: revisionNotes,
      timestamp: new Date()
    });

    res.json(milestoneWithProject);
  } catch (error) {
    next(error);
  }
};

// Auto-approve milestone (system)
const autoApproveMilestone = async (milestoneId) => {
  try {
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      throw new NotFoundError('Milestone not found');
    }

    const project = await Project.findById(milestone.project);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Calculate payment amount using split fee model for auto-approval
    // Client paid 1.9% upfront, freelancer pays 3.6% on release
    const projectPaymentSchedule = project.paymentSchedule ? JSON.parse(project.paymentSchedule) : {};
    const freelancerFeePercent = projectPaymentSchedule.freelancerFeePercent || 3.6; // 3.6% from freelancer

    // Convert milestone amount from currency units to base units for calculation
    let amountInBaseUnits;
    let currency = milestone.currency || project.currency || 'USD';
    switch (currency.toUpperCase()) {
      case 'JPY':
        // JPY has no decimal places
        amountInBaseUnits = milestone.amount;
        break;
      case 'BTC':
        // BTC uses 8 decimal places (satoshi)
        amountInBaseUnits = milestone.amount / 100000000;
        break;
      case 'ETH':
        // ETH uses 18 decimal places (wei)
        amountInBaseUnits = milestone.amount / 1000000000000000000;
        break;
      default:
        // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
        amountInBaseUnits = milestone.amount / 100;
    }

    const freelancerFee = amountInBaseUnits * (freelancerFeePercent / 100);
    const netAmount = amountInBaseUnits - freelancerFee; // Amount after freelancer fee

    // Get freelancer to release payment to
    const freelancer = await User.findById(project.freelancer);
    if (!freelancer || !freelancer.stripeAccountId) {
      console.error('Freelancer does not have a connected account for auto-approval');
      return null;
    }

    // Process payment release using Stripe
    const transfer = await stripeService.transferToFreelancer(
      netAmount,
      freelancer.stripeAccountId,
      `Auto-approved payment for milestone: ${milestone.title}`
    );

    // Update milestone status to auto-approved
    milestone.status = 'APPROVED';
    milestone.approvedAt = new Date();
    milestone.autoApproved = true;
    await milestone.save();

    // Update escrow amounts in project
    project.escrow.totalReleased += milestone.amount;
    project.escrow.remaining -= milestone.amount;

    // If all milestones are approved, mark project as completed
    const allMilestonesApproved = project.milestones.every(m => {
      return m.status === 'APPROVED' || m.status === 'DISPUTED';
    });
    
    if (allMilestonesApproved) {
      project.status = 'COMPLETED';
    }

    await project.save();

    // Create transaction record with split fee model for auto-approval
      // Calculate amounts in appropriate currency units
      let amountInCurrencyUnits, clientFeeInCurrencyUnits, freelancerFeeInCurrencyUnits, totalFeeInCurrencyUnits;
      switch (currency.toUpperCase()) {
        case 'JPY':
          // JPY has no decimal places
          amountInCurrencyUnits = Math.round(netAmount); // Net amount after freelancer fee
          clientFeeInCurrencyUnits = Math.round((milestone.amount) * 0.019); // 1.9% of original amount
          freelancerFeeInCurrencyUnits = Math.round(freelancerFee); // 3.6% of original amount in base units
          totalFeeInCurrencyUnits = Math.round((milestone.amount) * 0.055); // 5.5% total
          break;
        case 'BTC':
          // BTC uses 8 decimal places (satoshi)
          amountInCurrencyUnits = Math.round(netAmount * 100000000); // Net amount in satoshis
          clientFeeInCurrencyUnits = Math.round((milestone.amount / 100000000) * 0.019 * 100000000); // 1.9% in satoshis
          freelancerFeeInCurrencyUnits = Math.round(freelancerFee * 100000000); // 3.6% in satoshis
          totalFeeInCurrencyUnits = Math.round((milestone.amount / 100000000) * 0.055 * 100000000); // 5.5% in satoshis
          break;
        case 'ETH':
          // ETH uses 18 decimal places (wei)
          amountInCurrencyUnits = Math.round(netAmount * 1000000000000000000); // Net amount in wei
          clientFeeInCurrencyUnits = Math.round((milestone.amount / 1000000000000000000) * 0.019 * 1000000000000000000); // 1.9% in wei
          freelancerFeeInCurrencyUnits = Math.round(freelancerFee * 1000000000000000000); // 3.6% in wei
          totalFeeInCurrencyUnits = Math.round((milestone.amount / 1000000000000000000) * 0.055 * 1000000000000000000); // 5.5% in wei
          break;
        default:
          // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
          amountInCurrencyUnits = Math.round(netAmount * 100); // Net amount in cents
          clientFeeInCurrencyUnits = Math.round((milestone.amount / 100) * 0.019 * 100); // 1.9% in cents
          freelancerFeeInCurrencyUnits = Math.round(freelancerFee * 100); // 3.6% in cents
          totalFeeInCurrencyUnits = Math.round((milestone.amount / 100) * 0.055 * 100); // 5.5% in cents
      }

      const transaction = new Transaction({
        projectId: project._id,
        milestoneId: milestone._id,
        type: 'MILESTONE_RELEASE',
        amount: amountInCurrencyUnits, // in appropriate currency units (after freelancer fee)
        from: null, // from escrow
        to: project.freelancer,
        currency: currency,
        status: 'COMPLETED',
        provider: 'stripe',
        providerTransactionId: transfer.id,
        description: `Auto-approved payment release for milestone "${milestone.title}"`,
        fees: {
          client: clientFeeInCurrencyUnits, // Client fee paid upfront (approx)
          freelancer: freelancerFeeInCurrencyUnits, // 3.6% paid by freelancer on release
          platform: totalFeeInCurrencyUnits, // Total platform fee: 5.5%
          paymentProcessor: 0, // Will be calculated from Stripe response
          total: totalFeeInCurrencyUnits // Total fee: 5.5% of milestone amount
        }
      });

    await transaction.save();

    // Add to project activity log
    project.activityLog.push({
      action: 'MILESTONE_AUTO_APPROVED',
      performedBy: 'SYSTEM',
      details: {
        milestoneId: milestone._id,
        title: milestone.title,
        amount: Math.round(netAmount * 100),
        transactionId: transaction._id
      }
    });

    await project.save();

    // Notify project participants of auto-approval
    notifyProject(project._id, 'milestone-auto-approved', {
      milestoneId: milestone._id,
      title: milestone.title,
      amount: netAmount,
      timestamp: new Date()
    });

    return milestone;
  } catch (error) {
    console.error('Auto-approval error:', error);
    return null;
  }
};

module.exports = {
  getMilestones,
  getMilestone,
  createMilestone,
  startMilestone,
  submitMilestone,
  approveMilestone,
  requestRevision,
  autoApproveMilestone
};