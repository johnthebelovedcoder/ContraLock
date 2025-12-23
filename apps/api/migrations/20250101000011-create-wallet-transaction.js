'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('wallet_transactions', {
      _id: {
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      walletId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'wallets',
          key: '_id'
        }
      },
      type: {
        type: Sequelize.ENUM(
          'DEPOSIT',           // Funds added to wallet
          'WITHDRAWAL',        // Funds removed from wallet
          'TRANSFER',          // Transfer between wallets
          'PROJECT_FUNDS',     // Transfer to project escrow
          'PROJECT_REFUND',    // Funds returned from project
          'MILESTONE_PAYMENT', // Payment from wallet to freelancer
          'MILESTONE_INCOME',  // Income from completed milestone
          'REFUND',            // Refund to wallet
          'FEE',               // Platform fees
          'ADMIN_ADJUSTMENT'   // Manual adjustments by admin
        ),
        allowNull: false
      },
      amount: {
        type: Sequelize.INTEGER, // Amount in USD cents
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'USD'
      },
      fromWallet: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'wallets',
          key: '_id'
        }
      },
      toWallet: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'wallets',
          key: '_id'
        }
      },
      relatedEntity: {
        type: Sequelize.ENUM('Project', 'Milestone', 'Transaction', 'User', 'Dispute'),
        allowNull: true
      },
      relatedEntityId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: Sequelize.STRING,
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
        defaultValue: 'PENDING'
      },
      fees: {
        type: Sequelize.TEXT // Store as JSON string with platform, paymentProcessor, total
      },
      processedAt: Sequelize.DATE,
      failureReason: Sequelize.STRING,
      metadata: Sequelize.TEXT, // Additional transaction-specific data (JSON string)
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('wallet_transactions');
  }
};