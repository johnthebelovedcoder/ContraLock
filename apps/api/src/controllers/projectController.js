const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Dispute = require('../models/Dispute');
const { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } = require('../errors/AppError');
const stripeService = require('../services/paymentService');
const cryptoPaymentService = require('../services/cryptoPaymentService');
const { processAIAnalysis } = require('../services/aiService');
const contentModerationService = require('../services/contentModerationService');
const { notifyProject } = require('../socket/server');
const { Op } = require('sequelize');

// Get projects for the authenticated user
const getProjects = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status, role, page = 1, limit = 20 } = req.query;

    // Import Sequelize models directly for proper querying
    const { Project: SequelizeProject } = require('../db/sequelizeModels');

    // Build where conditions for Sequelize
    const whereConditions = {
      [Op.or]: [
        { client: userId },
        { freelancer: userId }
      ]
    };

    if (status) {
      whereConditions.status = status;
    }

    // Get projects with filters using proper Sequelize methods
    const projects = await SequelizeProject.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']], // Sequelize format for ordering
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Populate related data manually since the compatibility layer may not handle complex queries well
    const populatedProjects = [];

    for (const project of projects) {
      const projectJson = project.toJSON ? project.toJSON() : project;

      // Get client and freelancer information
      if (project.client) {
        const User = require('../models/User');
        const client = await User.findById(project.client);
        if (client) {
          const clientJson = client.toJSON ? client.toJSON() : client;
          // Apply field selection
          projectJson.client = {
            firstName: clientJson.firstName,
            lastName: clientJson.lastName,
            email: clientJson.email
          };
        }
      }

      if (project.freelancer) {
        const User = require('../models/User');
        const freelancer = await User.findById(project.freelancer);
        if (freelancer) {
          const freelancerJson = freelancer.toJSON ? freelancer.toJSON() : freelancer;
          // Apply field selection
          projectJson.freelancer = {
            firstName: freelancerJson.firstName,
            lastName: freelancerJson.lastName,
            email: freelancerJson.email
          };
        }
      }

      populatedProjects.push(projectJson);
    }

    // Get total count for pagination
    const total = await SequelizeProject.count({ where: whereConditions });

    res.json({
      items: populatedProjects,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in getProjects:', error);
    next(error);
  }
};

// Get a specific project
const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Import Sequelize models directly for proper querying
    const { Project: SequelizeProject } = require('../db/sequelizeModels');

    const project = await SequelizeProject.findByPk(id);

    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    const projectJson = project.toJSON ? project.toJSON() : project;

    if (projectJson.client !== userId && projectJson.freelancer !== userId) {
      return next(new ForbiddenError('Not authorized to access this project'));
    }

    // Manually populate related data
    if (projectJson.client) {
      const User = require('../models/User');
      const client = await User.findById(projectJson.client);
      if (client) {
        const clientJson = client.toJSON ? client.toJSON() : client;
        projectJson.client = {
          firstName: clientJson.firstName,
          lastName: clientJson.lastName,
          email: clientJson.email
        };
      }
    }

    if (projectJson.freelancer) {
      const User = require('../models/User');
      const freelancer = await User.findById(projectJson.freelancer);
      if (freelancer) {
        const freelancerJson = freelancer.toJSON ? freelancer.toJSON() : freelancer;
        projectJson.freelancer = {
          firstName: freelancerJson.firstName,
          lastName: freelancerJson.lastName,
          email: freelancerJson.email
        };
      }
    }

    // Get and populate milestones
    const Milestone = require('../models/Milestone');
    const milestones = await Milestone.find({ project: id });
    projectJson.milestones = milestones;

    res.json(projectJson);
  } catch (error) {
    next(error);
  }
};

// Create a new project
const createProject = async (req, res, next) => {
  try {
    const { title, description, category, budget, deadline, milestones, autoApproveDays = 7, currency = 'USD' } = req.body;
    const userId = req.user.userId;

    // Validate that the authenticated user is a client
    const user = await User.findById(userId);
    if (!user || user.role !== 'client') {
      return next(new ForbiddenError('Only clients can create projects'));
    }

    // Validate currency is supported
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BTC', 'ETH']; // Add more as needed
    if (!supportedCurrencies.includes(currency)) {
      return next(new BadRequestError(`Currency ${currency} is not supported. Supported currencies: ${supportedCurrencies.join(', ')}`));
    }

    // Validate budget is within allowed range (for USD equivalent)
    if (budget < 5000 || budget > 10000000) { // In cents when currency is USD
      return next(new BadRequestError('Budget must be between $50 and $100,000 (or equivalent in selected currency)'));
    }

    // Validate deadline is in the future
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return next(new BadRequestError('Deadline must be in the future'));
    }

    // Validate milestones
    if (!milestones || milestones.length === 0) {
      return next(new BadRequestError('At least one milestone is required'));
    }

    // Validate milestone amounts sum up to project budget
    const totalMilestoneAmount = milestones.reduce((sum, ms) => sum + ms.amount, 0);
    if (totalMilestoneAmount !== budget) {
      return next(new BadRequestError(`Milestone amounts ($${totalMilestoneAmount/100}) must equal project budget ($${budget/100})`));
    }

    // Validate each milestone
    for (const milestone of milestones) {
      if (milestone.amount < 5000) { // Minimum $50 in cents
        return next(new BadRequestError('Each milestone must be at least $50 (or equivalent in selected currency)'));
      }

      if (new Date(milestone.deadline) > deadlineDate) {
        return next(new BadRequestError('Milestone deadline cannot exceed project deadline'));
      }

      // Add currency to milestone
      milestone.currency = currency;
    }

    // Moderate project content before creation
    const moderationResult = await contentModerationService.moderateProject({
      _id: null,
      title,
      description
    });

    if (!moderationResult.isApproved) {
      return next(new BadRequestError(`Project content flagged: ${moderationResult.message}`));
    }

    // Create the project
    const project = new Project({
      title,
      description,
      category,
      budget,
      deadline: deadlineDate,
      client: userId,
      currency, // Add currency field
      status: 'DRAFT',
      milestones: [], // Will be created separately
      progress: {
        completed: 0,
        total: milestones.length
      },
      escrow: {
        status: 'NOT_DEPOSITED',
        totalHeld: 0,
        totalReleased: 0,
        remaining: 0
      },
      paymentSchedule: {
        autoApproveDays,
        clientFeePercent: 1.9,      // 1.9% added to contract value paid by client
        freelancerFeePercent: 3.6,  // 3.6% deducted from milestone payment paid by freelancer
        totalFeePercent: 5.5        // Total effective fee: ~5.5%
      },
      activityLog: [{
        action: 'PROJECT_CREATED',
        performedBy: userId,
        details: { title, currency }
      }]
    });

    await project.save();

    // Create milestones
    for (const msData of milestones) {
      const milestone = new Milestone({
        title: msData.title,
        description: msData.description,
        amount: msData.amount,
        deadline: new Date(msData.deadline),
        acceptanceCriteria: msData.acceptanceCriteria,
        project: project._id,
        currency: msData.currency || currency, // Use milestone currency or project currency
        status: 'PENDING'
      });

      await milestone.save();
      project.milestones.push(milestone._id);
    }

    await project.save();

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// Invite a freelancer to a project
const inviteFreelancer = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;
    const userId = req.user.userId;

    // Import Sequelize models directly for proper querying
    const { Project: SequelizeProject } = require('../db/sequelizeModels');
    const project = await SequelizeProject.findByPk(projectId);
    if (!project || project.client !== userId) {
      return next(new ForbiddenError('Only the project client can invite freelancers'));
    }

    const projectJson = project.toJSON ? project.toJSON() : project;

    if (projectJson.status !== 'DRAFT') {
      return next(new BadRequestError('Can only invite freelancers to draft projects'));
    }

    // Find freelancer by email
    const User = require('../models/User');
    const freelancer = await User.findOne({ email, role: 'freelancer' });
    if (!freelancer) {
      return next(new NotFoundError('Freelancer not found'));
    }

    // Update project with freelancer - need to use Sequelize update method
    await SequelizeProject.update(
      {
        freelancer: freelancer._id,
        status: 'PENDING_ACCEPTANCE'
      },
      { where: { _id: projectId } }
    );

    // Get the updated project
    const updatedProject = await SequelizeProject.findByPk(projectId);
    const updatedProjectJson = updatedProject.toJSON ? updatedProject.toJSON() : updatedProject;

    // Parse activity log, update it, and save it back
    let activityLog = updatedProjectJson.activityLog ? JSON.parse(updatedProjectJson.activityLog) : [];
    activityLog.push({
      action: 'FREELANCER_INVITED',
      performedBy: userId,
      details: {
        invitedFreelancer: freelancer._id,
        invitedEmail: email
      }
    });

    await SequelizeProject.update(
      { activityLog: JSON.stringify(activityLog) },
      { where: { _id: projectId } }
    );

    // Get the final updated project
    const finalProject = await SequelizeProject.findByPk(projectId);

    // In a real implementation, send invitation email
    // notifyFreelancerOfProjectInvitation(freelancer._id, projectId);

    res.json({
      message: 'Freelancer invited successfully',
      project: finalProject.toJSON ? finalProject.toJSON() : finalProject
    });
  } catch (error) {
    next(error);
  }
};

// Accept a project invitation
const acceptInvitation = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Import Sequelize models directly for proper querying
    const { Project: SequelizeProject } = require('../db/sequelizeModels');
    const project = await SequelizeProject.findByPk(projectId);
    if (!project || project.freelancer !== userId) {
      return next(new ForbiddenError('Not authorized to accept this project invitation'));
    }

    const projectJson = project.toJSON ? project.toJSON() : project;

    if (projectJson.status !== 'PENDING_ACCEPTANCE') {
      return next(new BadRequestError('Project is not pending acceptance'));
    }

    // Accept the invitation
    await SequelizeProject.update(
      { status: 'AWAITING_DEPOSIT' },
      { where: { _id: projectId } }
    );

    // Get the updated project
    const updatedProject = await SequelizeProject.findByPk(projectId);
    const updatedProjectJson = updatedProject.toJSON ? updatedProject.toJSON() : updatedProject;

    // Parse activity log, update it, and save it back
    let activityLog = updatedProjectJson.activityLog ? JSON.parse(updatedProjectJson.activityLog) : [];
    activityLog.push({
      action: 'INVITATION_ACCEPTED',
      performedBy: userId,
      details: { acceptedAt: new Date() }
    });

    await SequelizeProject.update(
      { activityLog: JSON.stringify(activityLog) },
      { where: { _id: projectId } }
    );

    // Get the final updated project
    const finalProject = await SequelizeProject.findByPk(projectId);

    res.json({
      message: 'Project invitation accepted',
      project: finalProject.toJSON ? finalProject.toJSON() : finalProject
    });
  } catch (error) {
    next(error);
  }
};

// Deposit funds to escrow
const depositFunds = async (req, res, next) => {
  try {
    const { projectId, paymentMethodId, paymentMethodType = 'traditional' } = req.body;
    const userId = req.user.userId;

    // Import Sequelize models directly for proper querying
    const { Project: SequelizeProject } = require('../db/sequelizeModels');
    const project = await SequelizeProject.findByPk(projectId);
    if (!project || project.client !== userId) {
      return next(new ForbiddenError('Only the project client can deposit funds'));
    }

    const projectJson = project.toJSON ? project.toJSON() : project;

    if (projectJson.status !== 'AWAITING_DEPOSIT') {
      return next(new BadRequestError('Project is not in a state for deposit'));
    }

    // Get the client to access their Stripe customer ID
    const User = require('../models/User');
    const client = await User.findById(userId);
    if (!client) {
      return next(new NotFoundError('Client not found'));
    }

    let paymentIntent;

    if (paymentMethodType === 'crypto') {
      // Process crypto payment
      paymentIntent = await cryptoPaymentService.processCryptoDeposit(
        projectJson.budget / 100, // Convert from cents to dollars
        projectId,
        userId,
        client.stripeCustomerId,
        projectJson.currency || 'USD'
      );
    } else {
      // Calculate total including platform fees - implementing split fee model
      // Client pays 1.9% (added to contract value)
      const parsedPaymentSchedule = projectJson.paymentSchedule ? JSON.parse(projectJson.paymentSchedule) : {};
      const clientFeePercent = parsedPaymentSchedule.clientFeePercent || 1.9; // 1.9% from client
      const platformFee = projectJson.budget * (clientFeePercent / 100); // In original currency units
      const totalAmount = projectJson.budget + platformFee; // Total in project currency units (client pays fee)

      // Create payment intent with Stripe
      paymentIntent = await stripeService.createPaymentIntent(
        totalAmount, // Use project currency amount directly; service handles conversion
        projectJson.currency || 'usd', // Use project currency
        `Deposit for project: ${projectJson.title}`,
        paymentMethodId,
        client.stripeCustomerId,
        { projectId, userId },
        paymentMethodType
      );
    }

    try {
      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
        // Update project status and escrow information
        const updatedEscrow = {
          status: 'HELD',
          totalHeld: projectJson.budget, // In cents
          totalReleased: 0,
          remaining: projectJson.budget // In cents
        };

        await SequelizeProject.update(
          {
            status: 'ACTIVE',
            escrow: JSON.stringify(updatedEscrow)
          },
          { where: { _id: projectId } }
        );

        if (paymentMethodType === 'crypto') {
        // For crypto payments, the status might be different (e.g., 'processing', 'partially_funded', etc.)
        // We'll update the project based on the crypto payment status
        if (paymentIntent.success) {
          // Update project status and escrow information
          const updatedEscrow = {
            status: 'HELD', // For crypto, we might need to adjust this based on actual payment status
            totalHeld: projectJson.budget, // In cents
            totalReleased: 0,
            remaining: projectJson.budget // In cents
          };

          await SequelizeProject.update(
            {
              status: 'ACTIVE',
              escrow: JSON.stringify(updatedEscrow)
            },
            { where: { _id: projectId } }
          );

          // Create transaction record for crypto payment
          const Transaction = require('../models/Transaction');
          // Calculate fees in appropriate currency units (for USD, use cents)
          let feeInCurrencyUnits;
          switch ((projectJson.currency || 'USD').toUpperCase()) {
            case 'JPY':
              // JPY has no decimal places
              feeInCurrencyUnits = Math.round(paymentIntent.clientFee);
              break;
            case 'BTC':
              // BTC uses 8 decimal places (satoshi)
              feeInCurrencyUnits = Math.round(paymentIntent.clientFee * 100000000);
              break;
            case 'ETH':
              // ETH uses 18 decimal places (wei)
              feeInCurrencyUnits = Math.round(paymentIntent.clientFee * 1000000000000000000);
              break;
            default:
              // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
              feeInCurrencyUnits = Math.round(paymentIntent.clientFee * 100);
          }

          const transaction = new Transaction({
            projectId: projectId,
            type: 'DEPOSIT',
            amount: projectJson.budget, // In original currency units
            from: userId,
            to: null, // Funds go to escrow
            currency: projectJson.currency || 'USD',
            status: 'PENDING_CRYPTO_CONFIRMATION', // Different status for crypto
            provider: 'stripe_crypto',
            providerTransactionId: paymentIntent.paymentIntentId,
            description: `Crypto deposit for project ${projectJson.title}`,
            fees: {
              client: feeInCurrencyUnits, // Amount in appropriate currency units
              freelancer: 0, // Freelancer fee calculated on release
              platform: feeInCurrencyUnits, // Total platform fee
              paymentProcessor: 0, // Will be calculated from Stripe fees
              total: feeInCurrencyUnits // Total fee paid by client
            }
          });

          await transaction.save();

          // Get the updated project for activity log
          const updatedProject = await SequelizeProject.findByPk(projectId);
          const updatedProjectJson = updatedProject.toJSON ? updatedProject.toJSON() : updatedProject;

          // Parse activity log, update it, and save it back
          let activityLog = updatedProjectJson.activityLog ? JSON.parse(updatedProjectJson.activityLog) : [];
          activityLog.push({
            action: 'FUNDS_DEPOSITED',
            performedBy: userId,
            details: {
              amount: projectJson.budget, // In cents
              transactionId: transaction._id,
              fees: transaction.fees,
              providerTransactionId: paymentIntent.paymentIntentId,
              paymentMethodType: 'crypto'
            }
          });

          await SequelizeProject.update(
            { activityLog: JSON.stringify(activityLog) },
            { where: { _id: projectId } }
          );

          // Get the final updated project
          const finalProject = await SequelizeProject.findByPk(projectId);

          // Send payment confirmation notification
          notifyProject(projectId, 'funds-deposited', {
            amount: projectJson.budget / 100, // Convert to dollars
            depositedBy: userId,
            timestamp: new Date(),
            paymentMethodType: 'crypto'
          });

          res.json({
            transaction,
            project: finalProject.toJSON ? finalProject.toJSON() : finalProject,
            paymentIntent: {
              id: paymentIntent.paymentIntentId,
              status: 'processing_crypto', // Custom status for crypto
              paymentMethodType: 'crypto'
            }
          });
        } else {
          return next(new BadRequestError(`Crypto payment failed: ${paymentIntent.error || 'Unknown error'}`));
        }
      } else {
        // Traditional payment flow
        if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
          // Update project status and escrow information
          const updatedEscrow = {
            status: 'HELD',
            totalHeld: projectJson.budget, // In cents
            totalReleased: 0,
            remaining: projectJson.budget // In cents
          };

          await SequelizeProject.update(
            {
              status: 'ACTIVE',
              escrow: JSON.stringify(updatedEscrow)
            },
            { where: { _id: projectId } }
          );

          // Calculate platform fee for traditional payment
          const parsedPaymentSchedule = projectJson.paymentSchedule ? JSON.parse(projectJson.paymentSchedule) : {};
          const clientFeePercent = parsedPaymentSchedule.clientFeePercent || 1.9;
          const platformFee = projectJson.budget * (clientFeePercent / 100);

          // Create transaction record - with split fee model details
          const Transaction = require('../models/Transaction');
          // Calculate platform fee in appropriate currency units
          let platformFeeInCurrencyUnits;
          switch ((projectJson.currency || 'USD').toUpperCase()) {
            case 'JPY':
              // JPY has no decimal places
              platformFeeInCurrencyUnits = Math.round((projectJson.budget * (clientFeePercent / 100)));
              break;
            case 'BTC':
              // BTC uses 8 decimal places (satoshi)
              platformFeeInCurrencyUnits = Math.round((projectJson.budget * (clientFeePercent / 100)) * 100000000);
              break;
            case 'ETH':
              // ETH uses 18 decimal places (wei)
              platformFeeInCurrencyUnits = Math.round((projectJson.budget * (clientFeePercent / 100)) * 1000000000000000000);
              break;
            default:
              // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
              platformFeeInCurrencyUnits = Math.round((projectJson.budget * (clientFeePercent / 100)) * 100);
          }

          const transaction = new Transaction({
            projectId: projectId,
            type: 'DEPOSIT',
            amount: projectJson.budget, // In original currency units
            from: userId,
            to: null, // Funds go to escrow
            currency: projectJson.currency || 'USD',
            status: 'COMPLETED',
            provider: 'stripe',
            providerTransactionId: paymentIntent.id,
            description: `Deposit for project ${projectJson.title}`,
            fees: {
              client: platformFeeInCurrencyUnits, // 1.9% paid by client (added to contract value)
              freelancer: 0, // Freelancer fee calculated on release
              platform: platformFeeInCurrencyUnits, // Total platform fee
              paymentProcessor: 0, // Will be calculated from Stripe fees
              total: platformFeeInCurrencyUnits // Total fee paid by client
            }
          });

          await transaction.save();

          // Get the updated project for activity log
          const updatedProject = await SequelizeProject.findByPk(projectId);
          const updatedProjectJson = updatedProject.toJSON ? updatedProject.toJSON() : updatedProject;

          // Parse activity log, update it, and save it back
          let activityLog = updatedProjectJson.activityLog ? JSON.parse(updatedProjectJson.activityLog) : [];
          activityLog.push({
            action: 'FUNDS_DEPOSITED',
            performedBy: userId,
            details: {
              amount: projectJson.budget, // In cents
              transactionId: transaction._id,
              fees: transaction.fees,
              providerTransactionId: paymentIntent.id
            }
          });

          await SequelizeProject.update(
            { activityLog: JSON.stringify(activityLog) },
            { where: { _id: projectId } }
          );

          // Get the final updated project
          const finalProject = await SequelizeProject.findByPk(projectId);

          // Send payment confirmation notification
          notifyProject(projectId, 'funds-deposited', {
            amount: projectJson.budget / 100, // Convert to dollars
            depositedBy: userId,
            timestamp: new Date()
          });

          res.json({
            transaction,
            project: finalProject.toJSON ? finalProject.toJSON() : finalProject,
            paymentIntent: {
              id: paymentIntent.id,
              status: paymentIntent.status
            }
          });
        } else {
          return next(new BadRequestError(`Payment failed with status: ${paymentIntent.status}`));
        }
      }
    }
    } catch (paymentError) {
      console.error('Payment processing error:', paymentError);
      return next(new BadRequestError(`Payment processing failed: ${paymentIntent ? paymentIntent.status : 'Unknown status'}: ${paymentError.message}`));
    }
  } catch (error) {
    console.error('Error in depositFunds:', error);
    next(error);
  }
};

// Cancel a project
const cancelProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Import Sequelize models directly for proper querying
    const { Project: SequelizeProject } = require('../db/sequelizeModels');
    const project = await SequelizeProject.findByPk(projectId);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    const projectJson = project.toJSON ? project.toJSON() : project;

    // Only the client or freelancer can cancel the project
    if (projectJson.client !== userId && projectJson.freelancer !== userId) {
      return next(new ForbiddenError('Not authorized to cancel this project'));
    }

    // Check if project can be cancelled (before funds are released)
    const Milestone = require('../models/Milestone');
    const activeMilestones = await Milestone.count({
      where: {
        project: projectId,
        status: {
          [Op.in]: ['IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED']
        }
      }
    });

    if (activeMilestones > 0) {
      return next(new BadRequestError('Cannot cancel project with active milestones'));
    }

    // Update project status
    await SequelizeProject.update(
      { status: 'CANCELLED' },
      { where: { _id: projectId } }
    );

    // Get the updated project for activity log
    const updatedProject = await SequelizeProject.findByPk(projectId);
    const updatedProjectJson = updatedProject.toJSON ? updatedProject.toJSON() : updatedProject;

    // Parse activity log, update it, and save it back
    let activityLog = updatedProjectJson.activityLog ? JSON.parse(updatedProjectJson.activityLog) : [];
    activityLog.push({
      action: 'PROJECT_CANCELLED',
      performedBy: userId,
      details: { cancelledAt: new Date() }
    });

    await SequelizeProject.update(
      { activityLog: JSON.stringify(activityLog) },
      { where: { _id: projectId } }
    );

    // Get the final updated project
    const finalProject = await SequelizeProject.findByPk(projectId);

    res.json({
      message: 'Project cancelled successfully',
      project: finalProject.toJSON ? finalProject.toJSON() : finalProject
    });
  } catch (error) {
    next(error);
  }
};

// Archive a project
const archiveProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Import Sequelize models directly for proper querying
    const { Project: SequelizeProject } = require('../db/sequelizeModels');
    const project = await SequelizeProject.findByPk(projectId);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    const projectJson = project.toJSON ? project.toJSON() : project;

    // Only the client can archive the project
    if (projectJson.client !== userId) {
      return next(new ForbiddenError('Only the project client can archive this project'));
    }

    // Update project status to archived
    await SequelizeProject.update(
      { status: 'ARCHIVED' },
      { where: { _id: projectId } }
    );

    // Get the updated project for activity log
    const updatedProject = await SequelizeProject.findByPk(projectId);
    const updatedProjectJson = updatedProject.toJSON ? updatedProject.toJSON() : updatedProject;

    // Parse activity log, update it, and save it back
    let activityLog = updatedProjectJson.activityLog ? JSON.parse(updatedProjectJson.activityLog) : [];
    activityLog.push({
      action: 'PROJECT_ARCHIVED',
      performedBy: userId,
      details: { archivedAt: new Date() }
    });

    await SequelizeProject.update(
      { activityLog: JSON.stringify(activityLog) },
      { where: { _id: projectId } }
    );

    // Get the final updated project
    const finalProject = await SequelizeProject.findByPk(projectId);

    res.json({
      message: 'Project archived successfully',
      project: finalProject.toJSON ? finalProject.toJSON() : finalProject
    });
  } catch (error) {
    next(error);
  }
};

// Duplicate a project
const duplicateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Import Sequelize models directly for proper querying
    const { Project: SequelizeProject } = require('../db/sequelizeModels');
    const project = await SequelizeProject.findByPk(projectId);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    const projectJson = project.toJSON ? project.toJSON() : project;

    // Only the client can duplicate the project
    if (projectJson.client !== userId) {
      return next(new ForbiddenError('Only the project client can duplicate this project'));
    }

    // Create a copy of the project with new properties
    const projectData = { ...projectJson };

    // Update properties for the duplicated project
    const duplicateData = {
      title: `${projectData.title} (Copy)`,
      description: projectData.description,
      category: projectData.category,
      budget: projectData.budget,
      deadline: projectData.deadline,
      client: userId, // Assign to the same client
      freelancer: null, // No freelancer initially
      status: 'DRAFT', // Start as draft
      milestones: projectData.milestones, // Copy milestones
      progress: JSON.stringify({ completed: 0, total: projectData.progress ? JSON.parse(projectData.progress).total : 0 }),
      escrow: JSON.stringify({
        status: 'NOT_DEPOSITED',
        totalHeld: 0,
        totalReleased: 0,
        remaining: 0
      }),
      currency: projectData.currency || 'USD',
      paymentSchedule: projectData.paymentSchedule,
      activityLog: JSON.stringify([{
        action: 'PROJECT_DUPLICATED',
        performedBy: userId,
        details: { originalProjectId: projectId, duplicatedAt: new Date() }
      }])
    };

    // Create the new project
    const newProject = await SequelizeProject.create(duplicateData);

    res.status(201).json({
      message: 'Project duplicated successfully',
      project: newProject.toJSON ? newProject.toJSON() : newProject
    });
  } catch (error) {
    next(error);
  }
};

// Submit counter proposals for project milestones
const submitCounterProposals = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { proposals } = req.body; // Array of counter proposals
    const userId = req.user.userId;

    // Import Sequelize models directly for proper querying
    const { Project: SequelizeProject, User: SequelizeUser } = require('../db/sequelizeModels');
    const project = await SequelizeProject.findByPk(projectId);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    const projectJson = project.toJSON ? project.toJSON() : project;

    // Only the assigned freelancer can submit counter proposals
    if (projectJson.freelancer !== userId) {
      return next(new ForbiddenError('Only the assigned freelancer can submit counter proposals'));
    }

    // Validate proposals array
    if (!Array.isArray(proposals) || proposals.length === 0) {
      return next(new BadRequestError('Proposals must be a non-empty array'));
    }

    // Verify that all proposed milestone IDs belong to this project
    const Milestone = require('../models/Milestone');
    for (const proposal of proposals) {
      const milestone = await Milestone.findOne({ where: { _id: proposal.milestoneId, project: projectId } });
      if (!milestone) {
        return next(new BadRequestError(`Milestone ${proposal.milestoneId} does not belong to this project`));
      }
    }

    // Add counter proposals to project activity log
    const activityLog = projectJson.activityLog ? JSON.parse(projectJson.activityLog) : [];
    activityLog.push({
      action: 'COUNTER_PROPOSALS_SUBMITTED',
      performedBy: userId,
      details: {
        proposals,
        submittedAt: new Date()
      }
    });

    await SequelizeProject.update(
      { activityLog: JSON.stringify(activityLog) },
      { where: { _id: projectId } }
    );

    // Get the client to send notification
    const client = await SequelizeUser.findByPk(projectJson.client);
    if (!client) {
      console.error(`Client not found for project ${projectId}`);
    } else {
      // Send notification to client about counter proposals
      const notificationService = require('../services/email/notificationService');
      try {
        await notificationService.sendNotification('COUNTER_PROPOSAL_SUBMITTED', {
          client: client.toJSON ? client.toJSON() : client,
          project: projectJson,
          proposals: proposals.map(proposal => ({
            milestoneTitle: proposal.milestoneTitle || 'Unknown',
            changes: proposal.changes || [],
            reason: proposal.reason || 'Not specified'
          }))
        });
      } catch (notificationError) {
        console.error('Error sending counter proposal notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    // Get the updated project
    const updatedProject = await SequelizeProject.findByPk(projectId);

    res.json({
      message: 'Counter proposals submitted successfully',
      project: updatedProject.toJSON ? updatedProject.toJSON() : updatedProject
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  inviteFreelancer,
  acceptInvitation,
  depositFunds,
  cancelProject,
  archiveProject,
  duplicateProject,
  submitCounterProposals
};