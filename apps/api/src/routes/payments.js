const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const { User, Project, Transaction, Wallet, WalletTransaction } = require('../models/modelManager');
const { Op } = require('sequelize');
const stripeService = require('../services/paymentService');
const walletService = require('../services/walletService');

const router = express.Router();


// Get user's platform wallet balance (replaces the old balance endpoint)
router.get('/balance/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this user\'s balance' });
      }
    }

    try {
      // Try to get wallet balance using the new wallet system
      const balance = await walletService.getBalance(userId);
      res.json({
        userId,
        availableBalance: balance.availableBalance / 100, // Convert from cents to dollars
        totalBalance: balance.totalBalance / 100, // Convert from cents to dollars
        lockedBalance: balance.lockedBalance / 100, // Convert from cents to dollars
        currency: balance.currency,
        pendingBalance: 0 // Amount in pending transactions
      });
    } catch (walletError) {
      console.warn('Wallet not found for user, falling back to old balance calculation:', walletError.message);

      // Fallback to the old method if wallet doesn't exist
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const balance = user.statistics?.totalEarned || 0;
      res.json({
        userId,
        availableBalance: balance,
        pendingBalance: 0,
        currency: 'USD'
      });
    }
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get escrow account for a project (matching frontend expectation)
router.get('/escrow/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify user is part of the project
    if (project.client.toString() !== userId && project.freelancer && project.freelancer.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this project\'s escrow' });
    }

    res.json({
      projectId: project._id,
      totalHeld: project.escrow.totalHeld,
      totalReleased: project.escrow.totalReleased,
      remaining: project.escrow.remaining,
      status: project.escrow.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    });
  } catch (error) {
    console.error('Get escrow account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user balance (matching frontend expectation)
router.get('/balance/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this user\'s balance' });
      }
    }

    // In a real implementation, this would calculate from completed transactions
    // For now, we'll return a simulated balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // This would typically come from summing successful transactions where user was recipient
    // minus any withdrawals
    const balance = user.statistics?.totalEarned || 0;

    res.json({
      userId,
      availableBalance: balance,
      pendingBalance: 0, // Amount in pending transactions
      currency: 'USD'
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's transactions (matching frontend expectation)
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, dateFrom, dateTo, projectId, page = 1, limit = 20 } = req.query;

    const whereConditions = {
      [Op.or]: [
        { from: userId },
        { to: userId }
      ]
    };

    if (type) {
      whereConditions.type = type;
    }

    if (projectId) {
      whereConditions.projectId = projectId;
    }

    if (dateFrom || dateTo) {
      whereConditions.createdAt = {};
      if (dateFrom) {
        whereConditions.createdAt[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        whereConditions.createdAt[Op.lte] = new Date(dateTo);
      }
    }

    // Get transactions with Sequelize compatibility wrapper
    const transactions = await Transaction.find({
      where: whereConditions,
      order: [['createdAt', 'DESC']], // Sequelize format for ordering
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await Transaction.count({ where: whereConditions });

    res.json({
      items: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction by ID (matching frontend expectation)
router.get('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const transaction = await Transaction.findOne({
      where: {
        _id: id,
        [Op.or]: [
          { from: userId },
          { to: userId }
        ]
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deposit funds to user's wallet first (new approach)
router.post('/deposit-to-wallet', authenticateToken, [
  body('amount').isFloat({ min: 50 }),
  body('currency').isString().optional().default('USD'),
  body('paymentMethodType').isIn(['card', 'crypto', 'bank', 'paypal']).optional().default('card'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      amount,
      currency = 'USD',
      paymentMethodType = 'card',
      paymentMethodId,
      cryptoTxHash,
      cryptoNetwork,
      exchangeRate,
      description
    } = req.body;
    const userId = req.user.userId;

    // Get the user to access their Stripe customer ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      // Attempt to create wallet if it doesn't exist
      try {
        await walletService.getUserWallet(userId);
      } catch (walletError) {
        if (walletError.message === 'Wallet not found') {
          await walletService.createWallet(userId);
        } else {
          throw walletError;
        }
      }

      // Process the payment based on the payment method
      if (paymentMethodType === 'crypto') {
        // For crypto payments, we need to handle differently
        // In a real implementation, we would verify the crypto transaction on the blockchain
        // For now, we'll simulate the process

        // Create wallet transaction record
        const walletTransaction = await WalletTransaction.create({
          walletId: (await walletService.getUserWallet(userId))._id,
          type: 'DEPOSIT',
          amount: Math.round(amount * 100), // in cents
          currency: currency.toUpperCase(),
          fromWallet: null,
          toWallet: (await walletService.getUserWallet(userId))._id,
          description: description || `Crypto deposit: ${cryptoTxHash ? cryptoTxHash.substring(0, 8) : 'N/A'}`,
          status: 'PENDING', // Crypto transactions start as pending until confirmed
          relatedEntity: 'User',
          relatedEntityId: userId,
          metadata: JSON.stringify({
            paymentMethodType,
            cryptoTxHash,
            cryptoNetwork,
            exchangeRate
          })
        });

        // Update wallet balance (pending)
        const wallet = await walletService.getWalletById(walletTransaction.walletId);
        wallet.balance += Math.round(amount * 100);
        wallet.totalDeposited += Math.round(amount * 100);
        await wallet.save();

        // In a real implementation, we would need to verify the crypto transaction
        // This could involve calling a blockchain API to confirm the transaction
        // For now, we'll mark it as completed after a short delay (simulating verification)
        setTimeout(async () => {
          try {
            walletTransaction.status = 'COMPLETED';
            await walletTransaction.save();
          } catch (err) {
            console.error('Error updating crypto wallet transaction status:', err);
          }
        }, 5000); // Simulate 5 seconds verification time

        res.json({
          walletTransaction,
          wallet: {
            ...wallet.toJSON(),
            availableBalance: wallet.balance - wallet.lockedBalance,
            totalBalance: wallet.balance
          }
        });
      } else {
        // Traditional payment method (card, bank, paypal)
        // Create payment intent with Stripe
        const paymentIntent = await stripeService.createPaymentIntent(
          amount, // Amount without platform fees since it's going to wallet
          currency.toLowerCase(),
          description || `Wallet deposit for user: ${user.firstName} ${user.lastName}`,
          paymentMethodId,
          user.stripeCustomerId, // Assuming the user has a Stripe customer ID
          {},
          paymentMethodType
        );

        if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
          // Create wallet transaction record
          const walletTransaction = await WalletTransaction.create({
            walletId: (await walletService.getUserWallet(userId))._id,
            type: 'DEPOSIT',
            amount: Math.round(amount * 100), // in cents
            currency: currency.toUpperCase(),
            fromWallet: null,
            toWallet: (await walletService.getUserWallet(userId))._id,
            status: 'COMPLETED',
            relatedEntity: 'User',
            relatedEntityId: userId,
            description: description || `Wallet deposit via ${paymentMethodType}`,
            metadata: JSON.stringify({
              paymentMethodType,
              paymentMethodId,
              stripeIntentId: paymentIntent.id
            })
          });

          // Update wallet balance
          const wallet = await walletService.getWalletById(walletTransaction.walletId);
          wallet.balance += Math.round(amount * 100);
          wallet.totalDeposited += Math.round(amount * 100);
          await wallet.save();

          res.json({
            walletTransaction,
            wallet: {
              ...wallet.toJSON(),
              availableBalance: wallet.balance - wallet.lockedBalance,
              totalBalance: wallet.balance
            },
            paymentIntent: {
              id: paymentIntent.id,
              status: paymentIntent.status,
              client_secret: paymentIntent.client_secret
            }
          });
        } else {
          return res.status(400).json({ error: `Payment failed with status: ${paymentIntent.status}` });
        }
      }
    } catch (paymentError) {
      console.error('Payment processing error:', paymentError);
      res.status(400).json({ error: `Payment processing failed: ${paymentError.message}` });
    }
  } catch (error) {
    console.error('Deposit to wallet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transfer funds from user's wallet to project escrow (new approach)
router.post('/transfer-to-project', authenticateToken, [
  body('projectId').isMongoId(),
  body('amount').isFloat({ min: 50 }),
  body('currency').isString().optional().default('USD'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      projectId,
      amount,
      currency = 'USD',
      description
    } = req.body;
    const userId = req.user.userId;

    // Verify user is the client for this project
    const project = await Project.findById(projectId);
    if (!project || project.client.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to deposit for this project' });
    }

    if (project.status !== 'AWAITING_DEPOSIT') {
      return res.status(400).json({ error: 'Project is not in a state for deposit' });
    }

    try {
      // Calculate total including platform fees - implementing split fee model
      // Client pays 1.9% (added to contract value)
      const projectPaymentSchedule = project.paymentSchedule ? JSON.parse(project.paymentSchedule) : {};
      const clientFeePercent = projectPaymentSchedule.clientFeePercent || 1.9;
      const platformFee = amount * (clientFeePercent / 100);
      const totalAmount = amount + platformFee; // Total amount including fees

      // Attempt to create wallet if it doesn't exist
      try {
        await walletService.getUserWallet(userId);
      } catch (walletError) {
        if (walletError.message === 'Wallet not found') {
          await walletService.createWallet(userId);
        } else {
          throw walletError;
        }
      }

      // Transfer funds from user's wallet to project escrow
      const result = await walletService.transferToProjectEscrow(userId, projectId, totalAmount, description || `Funds for project: ${project.title}`);

      // Update project status and escrow information
      project.status = 'ACTIVE';
      project.escrow = {
        status: 'HELD',
        totalHeld: Math.round(totalAmount * 100), // in cents
        totalReleased: 0,
        remaining: Math.round(totalAmount * 100), // in cents
        currency: currency.toUpperCase(), // Track the currency
        exchangeRate: null, // No exchange rate needed since funds came from wallet
        exchangeRateTimestamp: null
      };

      // Add to project activity log
      project.activityLog.push({
        action: 'FUNDS_DEPOSITED',
        performedBy: userId,
        details: {
          amount: Math.round(totalAmount * 100), // in cents
          currency: currency.toUpperCase(),
          transactionId: result.walletTransaction._id,
          fees: {
            platform: Math.round(platformFee * 100), // in cents
            paymentProcessor: 0,
            total: Math.round(platformFee * 100) // in cents
          }
        }
      });

      await project.save();

      // Send payment confirmation email
      try {
        const client = await User.findById(userId);
        const notificationService = require('../services/email/notificationService');

        await notificationService.sendNotification('PAYMENT_CONFIRMATION', {
          client: client.toObject(),
          project: project.toObject(),
          amount: totalAmount,
          currency: currency.toUpperCase(),
          transactionId: result.walletTransaction._id
        });
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
        // Don't fail the transaction if email fails
      }

      res.json({
        walletTransaction: result.walletTransaction,
        project,
        transfer: {
          fromWallet: result.wallet,
          amount: totalAmount
        }
      });
    } catch (transferError) {
      console.error('Transfer to project error:', transferError);
      res.status(400).json({ error: `Transfer failed: ${transferError.message}` });
    }
  } catch (error) {
    console.error('Transfer to project request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Make a deposit to escrow (original method - maintained for backward compatibility)
router.post('/deposit', authenticateToken, [
  body('projectId').isMongoId(),
  body('amount').isFloat({ min: 50 }),
  body('currency').isString().optional().default('USD'),
  body('paymentMethodType').isIn(['card', 'crypto', 'bank', 'paypal']).optional().default('card')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      projectId,
      amount,
      currency = 'USD',
      paymentMethodType = 'card',
      paymentMethodId,
      cryptoTxHash,
      cryptoNetwork,
      exchangeRate
    } = req.body;
    const userId = req.user.userId;

    // Verify user is the client for this project
    const project = await Project.findById(projectId);
    if (!project || project.client.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to deposit for this project' });
    }

    if (project.status !== 'AWAITING_DEPOSIT') {
      return res.status(400).json({ error: 'Project is not in a state for deposit' });
    }

    // Get the user to access their Stripe customer ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      // Calculate total including platform fees - implementing split fee model
      // Client pays 1.9% (added to contract value)
      const projectPaymentSchedule = project.paymentSchedule ? JSON.parse(project.paymentSchedule) : {};
      const clientFeePercent = projectPaymentSchedule.clientFeePercent || 1.9;
      const platformFee = amount * (clientFeePercent / 100);
      const totalAmount = amount + platformFee; // Total amount including fees

      // Convert to USD for standardization if needed
      let amountInUsd = amount;
      if (currency.toUpperCase() !== 'USD' && exchangeRate) {
        amountInUsd = amount * exchangeRate;
      }

      let paymentIntent;
      let transaction;

      if (paymentMethodType === 'crypto') {
        // For crypto payments, we need to handle differently
        // In a real implementation, we would verify the crypto transaction on the blockchain
        // For now, we'll simulate the process

        // Create transaction record
        transaction = new Transaction({
          projectId: projectId,
          type: 'DEPOSIT',
          amount: Math.round(amount * 100), // in cents (or smallest unit for crypto)
          currency: currency.toUpperCase(),
          amountInUsd: Math.round(amountInUsd * 100), // in cents
          from: userId,
          to: null, // Funds go to escrow
          status: 'PENDING', // Crypto transactions start as pending until confirmed
          paymentMethodType: paymentMethodType,
          cryptoTxHash: cryptoTxHash,
          cryptoNetwork: cryptoNetwork,
          exchangeRate: exchangeRate,
          exchangeRateTimestamp: new Date(),
          description: `Deposit for project ${project.title}`,
          fees: {
            platform: Math.round(platformFee * 100), // in cents
            paymentProcessor: 0, // Crypto fees are different
            total: Math.round(platformFee * 100) // in cents
          }
        });

        await transaction.save();

        // Update project status and escrow information
        project.status = 'ACTIVE';
        project.escrow = {
          status: 'HELD',
          totalHeld: Math.round(amount * 100), // in cents
          totalReleased: 0,
          remaining: Math.round(amount * 100), // in cents
          currency: currency.toUpperCase(), // Track the currency
          exchangeRate: exchangeRate, // Store exchange rate used
          exchangeRateTimestamp: new Date() // When rate was applied
        };

        // Add to project activity log
        project.activityLog.push({
          action: 'FUNDS_DEPOSITED',
          performedBy: userId,
          details: {
            amount: Math.round(amount * 100), // in cents
            currency: currency.toUpperCase(),
            transactionId: transaction._id,
            fees: transaction.fees,
            cryptoTxHash: cryptoTxHash,
            cryptoNetwork: cryptoNetwork
          }
        });

        await project.save();

        // In a real implementation, we would need to verify the crypto transaction
        // This could involve calling a blockchain API to confirm the transaction
        // For now, we'll mark it as completed after a short delay (simulating verification)
        setTimeout(async () => {
          try {
            // Update transaction status to completed after verification
            transaction.status = 'COMPLETED';
            await transaction.save();

            // Update project status if needed
            const updatedProject = await Project.findById(projectId);
            if (updatedProject) {
              // Add another activity log entry for confirmation
              updatedProject.activityLog.push({
                action: 'CRYPTO_TX_CONFIRMED',
                performedBy: userId,
                details: {
                  amount: Math.round(amount * 100), // in cents
                  transactionId: transaction._id,
                  cryptoTxHash: cryptoTxHash
                }
              });
              await updatedProject.save();
            }
          } catch (err) {
            console.error('Error updating crypto transaction status:', err);
          }
        }, 5000); // Simulate 5 seconds verification time
      } else {
        // Traditional payment method (card, bank, paypal)
        // Create payment intent with Stripe
        paymentIntent = await stripeService.createPaymentIntent(
          totalAmount,
          currency.toLowerCase(),
          `Deposit for project: ${project.title}`,
          paymentMethodId,
          user.stripeCustomerId, // Assuming the user has a Stripe customer ID
          {},
          paymentMethodType
        );

        if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
          // Create transaction record
          transaction = new Transaction({
            projectId: projectId,
            type: 'DEPOSIT',
            amount: Math.round(amount * 100), // in cents
            currency: currency.toUpperCase(),
            amountInUsd: Math.round(amountInUsd * 100), // in cents
            from: userId,
            to: null, // Funds go to escrow
            status: 'COMPLETED',
            paymentMethodType: paymentMethodType,
            paymentMethodId: paymentMethodId,
            stripeIntentId: paymentIntent.id,
            exchangeRate: exchangeRate,
            exchangeRateTimestamp: new Date(),
            description: `Deposit for project ${project.title}`,
            fees: {
              platform: Math.round(platformFee * 100), // in cents
              paymentProcessor: 0, // Will be calculated from Stripe fees
              total: Math.round(platformFee * 100) // in cents
            }
          });

          await transaction.save();

          // Update project status and escrow information
          project.status = 'ACTIVE';
          project.escrow = {
            status: 'HELD',
            totalHeld: Math.round(amount * 100), // in cents
            totalReleased: 0,
            remaining: Math.round(amount * 100), // in cents
            currency: currency.toUpperCase(), // Track the currency
            exchangeRate: exchangeRate, // Store exchange rate used
            exchangeRateTimestamp: new Date() // When rate was applied
          };

          // Add to project activity log
          project.activityLog.push({
            action: 'FUNDS_DEPOSITED',
            performedBy: userId,
            details: {
              amount: Math.round(amount * 100), // in cents
              currency: currency.toUpperCase(),
              transactionId: transaction._id,
              fees: transaction.fees,
              providerTransactionId: paymentIntent.id
            }
          });

          await project.save();
        } else {
          return res.status(400).json({ error: `Payment failed with status: ${paymentIntent.status}` });
        }
      }

      // Send payment confirmation email
      try {
        const client = await User.findById(userId);
        const notificationService = require('../services/email/notificationService');

        await notificationService.sendNotification('PAYMENT_CONFIRMATION', {
          client: client.toObject(),
          project: project.toObject(),
          amount: amount,
          currency: currency.toUpperCase(),
          transactionId: transaction._id
        });
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
        // Don't fail the transaction if email fails
      }

      res.json({
        transaction,
        project,
        ...(paymentIntent && {
          paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            client_secret: paymentIntent.client_secret
          }
        })
      });
    } catch (paymentError) {
      console.error('Payment processing error:', paymentError);
      res.status(400).json({ error: `Payment processing failed: ${paymentError.message}` });
    }
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process milestone payment release
router.post('/release', authenticateToken, [
  body('projectId').isMongoId(),
  body('milestoneId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, milestoneId } = req.body;
    const userId = req.user.userId;

    // Verify user is the client for this project
    const project = await Project.findById(projectId);
    if (!project || project.client.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to release payment for this project' });
    }

    // Find the milestone
    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Milestone is not in submitted status' });
    }

    // Get freelancer's user record
    const freelancer = await User.findById(project.freelancer);
    if (!freelancer) {
      return res.status(400).json({ error: 'Freelancer not found' });
    }

    try {
      // Calculate payment amount using split fee model
      // Client paid 1.9% upfront, freelancer pays 3.6% on release
      const projectPaymentSchedule = project.paymentSchedule ? JSON.parse(project.paymentSchedule) : {};
      const freelancerFeePercent = projectPaymentSchedule.freelancerFeePercent || 3.6; // 3.6% from freelancer
      const milestoneAmountInDollars = milestone.amount / 100; // Convert from cents to dollars
      const freelancerFee = milestoneAmountInDollars * (freelancerFeePercent / 100);
      const netAmount = milestoneAmountInDollars - freelancerFee; // Amount after freelancer fee

      // Attempt to create wallet for freelancer if it doesn't exist
      try {
        await walletService.getUserWallet(freelancer._id);
      } catch (walletError) {
        if (walletError.message === 'Wallet not found') {
          await walletService.createWallet(freelancer._id);
        } else {
          throw walletError;
        }
      }

      // Transfer funds from project escrow to freelancer's wallet using the wallet service
      const result = await walletService.transferFromProjectToFreelancer(projectId, freelancer._id, netAmount, `Payment for milestone: ${milestone.title}`);

      // Update milestone status
      milestone.status = 'APPROVED';
      milestone.approvedAt = new Date();

      // Update escrow amounts
      project.escrow.totalReleased += milestone.amount; // milestone.amount is in cents
      project.escrow.remaining -= milestone.amount;

      // If all milestones are approved, mark project as completed
      const allMilestonesApproved = project.milestones.every(m => m.status === 'APPROVED');
      if (allMilestonesApproved) {
        project.status = 'COMPLETED';
      }

      await project.save();

      // Create transaction record (keeping the original Transaction model for backward compatibility)
      const transaction = new Transaction({
        projectId: projectId,
        milestoneId: milestoneId,
        type: 'MILESTONE_RELEASE',
        amount: Math.round(netAmount * 100), // Convert to cents
        from: null, // From escrow
        to: project.freelancer,
        status: 'COMPLETED', // Mark as completed since transfer happened
        provider: 'wallet',
        description: `Payment release for milestone "${milestone.title}" to freelancer wallet`,
        fees: {
          platform: Math.round(freelancerFee * 100), // in cents
          paymentProcessor: 0,
          total: Math.round(freelancerFee * 100) // in cents
        }
      });

      await transaction.save();

      // Add to project activity log
      project.activityLog.push({
        action: 'PAYMENT_RELEASED',
        performedBy: userId,
        details: {
          milestoneId: milestoneId,
          amount: Math.round(netAmount * 100), // in cents
          transactionId: transaction._id,
          walletTransactionId: result.walletTransaction._id
        }
      });

      await project.save();

      // Send payment release notification to freelancer
      try {
        const notificationService = require('../services/email/notificationService');

        await notificationService.sendNotification('PAYMENT_RELEASE', {
          freelancer: freelancer.toObject(),
          project: project.toObject(),
          milestone: milestone.toObject(),
          amount: netAmount
        });
      } catch (emailError) {
        console.error('Failed to send payment release notification:', emailError);
        // Don't fail the transaction if email fails
      }

      res.json({
        transaction,
        project,
        walletTransaction: result.walletTransaction,
        transfer: {
          amount: netAmount * 100, // in cents
          status: 'completed',
          toWallet: result.freelancerWallet
        }
      });
    } catch (transferError) {
      console.error('Wallet transfer error during milestone release:', transferError);
      res.status(400).json({ error: `Payment release failed: ${transferError.message}` });
    }
  } catch (error) {
    console.error('Release payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request a withdrawal
router.post('/withdraw', authenticateToken, [
  body('amount').isFloat({ min: 50 }),
  body('paymentMethodId').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethodId } = req.body;
    const userId = req.user.userId;

    // In a real implementation, we would check the user's available balance
    // For now, we'll simulate the withdrawal process

    try {
      // In real implementation:
      // 1. Verify user has sufficient balance
      // 2. Create Stripe payout
      // 3. Update user balance

      const payout = {
        id: `po_${Date.now()}`,
        amount: amount * 100, // in cents
        currency: 'usd',
        status: 'pending'
      };

      // Create transaction record
      const transaction = new Transaction({
        type: 'WITHDRAWAL',
        amount: amount * 100, // in cents
        from: userId,
        to: null, // To external account
        status: 'PENDING',
        provider: 'stripe',
        providerTransactionId: payout.id,
        description: 'Withdrawal to external account'
      });

      await transaction.save();

      res.json({
        success: true,
        transaction,
        payout
      });
    } catch (stripeError) {
      console.error('Stripe payout error:', stripeError);
      res.status(400).json({ error: 'Withdrawal failed' });
    }
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payouts for a user (matching frontend expectation)
router.get('/payouts/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this user\'s payouts' });
      }
    }

    // In a real implementation, this would query for payout transactions
    // For now, we'll return an empty array
    res.json([]);
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a payout (matching frontend expectation)
router.post('/payouts', authenticateToken, [
  body('userId').isMongoId(),
  body('amount').isFloat({ min: 50 }),
  body('payoutMethod').isIn(['BANK_TRANSFER', 'INSTANT_DEPOSIT', 'PAYPAL'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, amount, payoutMethod, paymentMethodId } = req.body;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to create payout for this user' });
      }
    }

    // In a real implementation, this would verify user has sufficient balance and process the payout
    // For now, we'll simulate the process
    const payout = {
      id: `payout_${Date.now()}`,
      userId,
      amount: amount * 100, // in cents
      method: payoutMethod.toLowerCase().replace('_', '-'), // Convert to stripe format
      status: 'processing',
      createdAt: new Date(),
      estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
    };

    res.json(payout);
  } catch (error) {
    console.error('Create payout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payout by ID (matching frontend expectation)
router.get('/payouts/:payoutId', authenticateToken, async (req, res) => {
  try {
    const { payoutId } = req.params;
    // This would fetch a specific payout by ID in a real implementation
    res.json({ id: payoutId, status: 'processing' });
  } catch (error) {
    console.error('Get payout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel a payout (matching frontend expectation)
router.patch('/payouts/:payoutId/cancel', authenticateToken, async (req, res) => {
  try {
    const { payoutId } = req.params;
    // This would cancel a specific payout in a real implementation
    res.json({ id: payoutId, status: 'canceled' });
  } catch (error) {
    console.error('Cancel payout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Estimate payout fees (matching frontend expectation)
router.post('/payouts/estimate', authenticateToken, [
  body('userId').isMongoId(),
  body('amount').isFloat({ min: 50 }),
  body('method').isIn(['BANK_TRANSFER', 'INSTANT_DEPOSIT', 'PAYPAL'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, amount, method } = req.body;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to estimate payouts for this user' });
      }
    }

    // Calculate fees based on method
    let fees = 0;
    switch (method) {
      case 'INSTANT_DEPOSIT':
        fees = amount * 0.01; // 1% for instant
        break;
      case 'PAYPAL':
        fees = amount * 0.02; // 2% for PayPal
        break;
      case 'BANK_TRANSFER':
      default:
        fees = 0; // Free for bank transfer
    }

    const netAmount = amount - fees;

    res.json({ fees, netAmount });
  } catch (error) {
    console.error('Estimate payout fees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get invoice by ID (matching frontend expectation)
router.get('/invoices/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.userId;

    // In a real implementation, this would fetch the invoice details
    // and verify the user has permission to access it
    res.json({
      id: invoiceId,
      projectId: 'project_123',
      milestoneId: 'milestone_123',
      amount: 150000, // in cents
      status: 'paid',
      issuedDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      client: {
        name: 'Client Name',
        email: 'client@example.com'
      },
      freelancer: {
        name: 'Freelancer Name',
        email: 'freelancer@example.com'
      }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download invoice (matching frontend expectation)
router.get('/invoices/:invoiceId/download', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    // This would generate and return a PDF invoice in a real implementation
    res.status(404).json({ error: 'Invoice download not implemented' });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;