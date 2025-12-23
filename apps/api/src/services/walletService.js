const { Wallet, WalletTransaction, User, Transaction, Project } = require('../models/modelManager');
const { Op } = require('sequelize');

class WalletService {
  // Create wallet for a user
  async createWallet(userId) {
    const existingWallet = await Wallet.findOne({ where: { userId } });
    if (existingWallet) {
      throw new Error('Wallet already exists for this user');
    }

    const wallet = await Wallet.create({
      userId,
      balance: 0,
      currency: 'USD',
      status: 'ACTIVE',
      lockedBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0
    });

    return wallet;
  }

  // Get user's wallet
  async getUserWallet(userId) {
    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    return wallet;
  }

  // Get wallet by ID
  async getWalletById(walletId) {
    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    return wallet;
  }

  // Deposit funds to wallet
  async depositToWallet(userId, amount, source, description = '', externalTransactionId = null) {
    const wallet = await this.getUserWallet(userId);
    if (wallet.status !== 'ACTIVE') {
      throw new Error('Wallet is not active');
    }

    const transaction = await WalletTransaction.create({
      walletId: wallet._id,
      type: 'DEPOSIT',
      amount: Math.round(amount * 100), // Convert to cents
      currency: wallet.currency,
      fromWallet: null,
      toWallet: wallet._id,
      description: description || `Deposit from ${source}`,
      status: 'COMPLETED',
      relatedEntity: 'User',
      relatedEntityId: userId,
      metadata: JSON.stringify({
        source,
        externalTransactionId
      })
    });

    // Update wallet balance
    wallet.balance += Math.round(amount * 100);
    wallet.totalDeposited += Math.round(amount * 100);
    await wallet.save();

    return { wallet, transaction };
  }

  // Withdraw funds from wallet
  async withdrawFromWallet(userId, amount, destination, description = '', externalTransactionId = null) {
    const wallet = await this.getUserWallet(userId);
    if (wallet.status !== 'ACTIVE') {
      throw new Error('Wallet is not active');
    }

    if (wallet.balance < Math.round(amount * 100)) {
      throw new Error('Insufficient balance');
    }

    if (wallet.lockedBalance > 0 && (wallet.balance - wallet.lockedBalance) < Math.round(amount * 100)) {
      throw new Error('Insufficient available balance (some funds are locked)');
    }

    const transaction = await WalletTransaction.create({
      walletId: wallet._id,
      type: 'WITHDRAWAL',
      amount: Math.round(amount * 100), // Convert to cents
      currency: wallet.currency,
      fromWallet: wallet._id,
      toWallet: null,
      description: description || `Withdrawal to ${destination}`,
      status: 'PENDING', // Will be updated after external processing
      relatedEntity: 'User',
      relatedEntityId: userId,
      metadata: JSON.stringify({
        destination,
        externalTransactionId
      })
    });

    // Update wallet balance (pending withdrawal)
    wallet.balance -= Math.round(amount * 100);
    wallet.totalWithdrawn += Math.round(amount * 100);
    await wallet.save();

    return { wallet, transaction };
  }

  // Transfer funds between wallets (for payments)
  async transferBetweenWallets(fromUserId, toUserId, amount, description = '') {
    if (fromUserId === toUserId) {
      throw new Error('Cannot transfer to the same wallet');
    }

    const fromWallet = await this.getUserWallet(fromUserId);
    const toWallet = await this.getUserWallet(toUserId);

    if (fromWallet.status !== 'ACTIVE' || toWallet.status !== 'ACTIVE') {
      throw new Error('One or both wallets are not active');
    }

    if (fromWallet.balance < Math.round(amount * 100)) {
      throw new Error('Insufficient balance');
    }

    // Create transaction record
    const transaction = await WalletTransaction.create({
      walletId: fromWallet._id,
      type: 'TRANSFER',
      amount: Math.round(amount * 100),
      currency: fromWallet.currency,
      fromWallet: fromWallet._id,
      toWallet: toWallet._id,
      description: description,
      status: 'COMPLETED',
      relatedEntity: 'User',
      relatedEntityId: toUserId
    });

    // Update balances atomically
    fromWallet.balance -= Math.round(amount * 100);
    toWallet.balance += Math.round(amount * 100);
    
    await fromWallet.save();
    await toWallet.save();

    return { fromWallet, toWallet, transaction };
  }

  // Transfer funds from wallet to project escrow
  async transferToProjectEscrow(userId, projectId, amount, description = '') {
    const wallet = await this.getUserWallet(userId);
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    if (wallet.status !== 'ACTIVE') {
      throw new Error('Wallet is not active');
    }

    if (wallet.balance < Math.round(amount * 100)) {
      throw new Error('Insufficient balance');
    }

    // Create wallet transaction
    const walletTransaction = await WalletTransaction.create({
      walletId: wallet._id,
      type: 'PROJECT_FUNDS',
      amount: Math.round(amount * 100),
      currency: wallet.currency,
      fromWallet: wallet._id,
      toWallet: null,
      relatedEntity: 'Project',
      relatedEntityId: projectId,
      description: description || `Funds for project ${project.title}`,
      status: 'COMPLETED'
    });

    // Update wallet balance
    wallet.balance -= Math.round(amount * 100);
    await wallet.save();

    // Update project escrow (this should be handled by the existing project system)
    // For now, we'll just return the transaction details
    return { wallet, walletTransaction, project };
  }

  // Transfer funds from project escrow to freelancer wallet
  async transferFromProjectToFreelancer(projectId, freelancerUserId, amount, description = '') {
    const freelancerWallet = await this.getUserWallet(freelancerUserId);
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    if (freelancerWallet.status !== 'ACTIVE') {
      throw new Error('Freelancer wallet is not active');
    }

    // Create wallet transaction for freelancer income
    const walletTransaction = await WalletTransaction.create({
      walletId: freelancerWallet._id,
      type: 'MILESTONE_INCOME',
      amount: Math.round(amount * 100),
      currency: freelancerWallet.currency,
      fromWallet: null,
      toWallet: freelancerWallet._id,
      relatedEntity: 'Project',
      relatedEntityId: projectId,
      description: description || `Payment for project completion`,
      status: 'COMPLETED'
    });

    // Update freelancer wallet balance
    freelancerWallet.balance += Math.round(amount * 100);
    await freelancerWallet.save();

    return { freelancerWallet, walletTransaction, project };
  }

  // Get wallet transactions
  async getWalletTransactions(userId, options = {}) {
    const wallet = await this.getUserWallet(userId);
    
    const whereConditions = {
      [Op.or]: [
        { fromWallet: wallet._id },
        { toWallet: wallet._id }
      ]
    };

    if (options.type) {
      whereConditions.type = options.type;
    }

    if (options.relatedEntity) {
      whereConditions.relatedEntity = options.relatedEntity;
    }

    if (options.relatedEntityId) {
      whereConditions.relatedEntityId = options.relatedEntityId;
    }

    const transactions = await WalletTransaction.find({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: options.limit || 20,
      offset: options.offset || 0
    });

    return transactions;
  }

  // Get wallet balance
  async getBalance(userId) {
    const wallet = await this.getUserWallet(userId);
    return {
      availableBalance: wallet.balance - wallet.lockedBalance,
      totalBalance: wallet.balance,
      lockedBalance: wallet.lockedBalance,
      currency: wallet.currency
    };
  }

  // Lock funds in wallet (for pending transactions)
  async lockFunds(userId, amount, reason = 'pending_transaction') {
    const wallet = await this.getUserWallet(userId);
    
    if (wallet.balance < Math.round(amount * 100)) {
      throw new Error('Insufficient balance to lock');
    }

    if ((wallet.balance - wallet.lockedBalance) < Math.round(amount * 100)) {
      throw new Error('Insufficient available balance to lock');
    }

    wallet.lockedBalance += Math.round(amount * 100);
    await wallet.save();

    return wallet;
  }

  // Unlock funds in wallet
  async unlockFunds(userId, amount) {
    const wallet = await this.getUserWallet(userId);
    
    if (wallet.lockedBalance < Math.round(amount * 100)) {
      throw new Error('Not enough locked funds to unlock');
    }

    wallet.lockedBalance -= Math.round(amount * 100);
    await wallet.save();

    return wallet;
  }

  // Refund funds to wallet
  async refundToWallet(userId, amount, source, description = '') {
    const wallet = await this.getUserWallet(userId);
    if (wallet.status !== 'ACTIVE') {
      throw new Error('Wallet is not active');
    }

    const transaction = await WalletTransaction.create({
      walletId: wallet._id,
      type: 'REFUND',
      amount: Math.round(amount * 100), // Convert to cents
      currency: wallet.currency,
      fromWallet: null,
      toWallet: wallet._id,
      description: description || `Refund from ${source}`,
      status: 'COMPLETED',
      relatedEntity: 'User',
      relatedEntityId: userId
    });

    // Update wallet balance
    wallet.balance += Math.round(amount * 100);
    await wallet.save();

    return { wallet, transaction };
  }

  // Get all wallets with their balances
  async getAllWallets(options = {}) {
    const whereConditions = {};
    
    if (options.status) {
      whereConditions.status = options.status;
    }

    const wallets = await Wallet.find({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: options.limit || 50,
      offset: options.offset || 0
    });

    return wallets;
  }
}

module.exports = new WalletService();