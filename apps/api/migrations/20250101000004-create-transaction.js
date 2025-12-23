'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      _id: {
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      projectId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'projects',
          key: '_id'
        }
      },
      milestoneId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'milestones',
          key: '_id'
        }
      },
      disputeId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM(
          'DEPOSIT',           // Client deposits funds
          'MILESTONE_RELEASE', // Release payment for milestone
          'DISPUTE_REFUND',    // Refund due to dispute resolution
          'DISPUTE_PAYMENT',   // Payment due to dispute resolution
          'ADMIN_ADJUSTMENT',  // Manual adjustment by admin
          'REFUND'             // General refund
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
      from: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: '_id'
        }
      },
      to: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: '_id'
        }
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
        defaultValue: 'PENDING'
      },
      provider: {
        type: Sequelize.STRING, // 'stripe', 'paypal', etc.
        allowNull: false
      },
      providerTransactionId: {
        type: Sequelize.STRING // ID from payment provider (e.g. Stripe)
      },
      description: Sequelize.STRING,
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
    await queryInterface.dropTable('transactions');
  }
};