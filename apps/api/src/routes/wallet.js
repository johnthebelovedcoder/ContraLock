const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const walletService = require('../services/walletService');

const router = express.Router();

// Get user's wallet
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const wallet = await walletService.getUserWallet(req.user.userId);
    const balance = await walletService.getBalance(req.user.userId);
    
    res.json({
      ...wallet.toJSON(),
      availableBalance: balance.availableBalance,
      totalBalance: balance.totalBalance,
      lockedBalance: balance.lockedBalance
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get wallet balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const balance = await walletService.getBalance(req.user.userId);
    res.json(balance);
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create wallet for user (if doesn't exist)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const wallet = await walletService.createWallet(req.user.userId);
    res.status(201).json(wallet);
  } catch (error) {
    console.error('Create wallet error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deposit to wallet
router.post('/deposit', authenticateToken, [
  body('amount').isFloat({ min: 50 }),
  body('source').isIn(['card', 'crypto', 'bank', 'paypal', 'wallet']),
  body('description').optional().isString(),
  body('externalTransactionId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, source, description, externalTransactionId } = req.body;
    const { userId } = req.user;

    const result = await walletService.depositToWallet(userId, amount, source, description, externalTransactionId);
    res.json(result);
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Withdraw from wallet
router.post('/withdraw', authenticateToken, [
  body('amount').isFloat({ min: 10 }),
  body('destination').isIn(['bank', 'card', 'paypal', 'crypto']),
  body('description').optional().isString(),
  body('externalTransactionId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, destination, description, externalTransactionId } = req.body;
    const { userId } = req.user;

    const result = await walletService.withdrawFromWallet(userId, amount, destination, description, externalTransactionId);
    res.json(result);
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transfer funds between wallets
router.post('/transfer', authenticateToken, [
  body('toUserId').isMongoId(),
  body('amount').isFloat({ min: 10 }),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { toUserId, amount, description } = req.body;
    const { userId } = req.user;

    const result = await walletService.transferBetweenWallets(userId, toUserId, amount, description);
    res.json(result);
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get wallet transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { type, relatedEntity, relatedEntityId, limit = 20, page = 1 } = req.query;
    const { userId } = req.user;

    const transactions = await walletService.getWalletTransactions(userId, {
      type,
      relatedEntity,
      relatedEntityId,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lock funds in wallet (for pending transactions)
router.post('/lock-funds', authenticateToken, [
  body('amount').isFloat({ min: 1 }),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, reason } = req.body;
    const { userId } = req.user;

    const wallet = await walletService.lockFunds(userId, amount, reason);
    res.json(wallet);
  } catch (error) {
    console.error('Lock funds error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unlock funds in wallet
router.post('/unlock-funds', authenticateToken, [
  body('amount').isFloat({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount } = req.body;
    const { userId } = req.user;

    const wallet = await walletService.unlockFunds(userId, amount);
    res.json(wallet);
  } catch (error) {
    console.error('Unlock funds error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refund to wallet
router.post('/refund', authenticateToken, [
  body('amount').isFloat({ min: 1 }),
  body('source').isString(),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, source, description } = req.body;
    const { userId } = req.user;

    const result = await walletService.refundToWallet(userId, amount, source, description);
    res.json(result);
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin route to get all wallets
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const requestingUser = await require('../models/modelManager').User.findById(req.user.userId);
    if (requestingUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, limit = 50, page = 1 } = req.query;

    const wallets = await walletService.getAllWallets({
      status,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json(wallets);
  } catch (error) {
    console.error('Get all wallets error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;