'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projects', {
      _id: {
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'title',
        validate: {
          len: [1, 100]
        }
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          len: [1, 2000]
        }
      },
      category: {
        type: Sequelize.ENUM('Design', 'Development', 'Writing', 'Marketing', 'Consulting', 'Other'),
        allowNull: false
      },
      budget: {
        type: Sequelize.INTEGER, // Amount in USD cents
        allowNull: false,
        validate: {
          min: 5000, // Minimum $50 in cents
          max: 10000000 // Maximum $100,000 in cents
        }
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
          'DRAFT',              // Project created but not sent
          'PENDING_ACCEPTANCE', // Invitation sent to freelancer
          'AWAITING_DEPOSIT',   // Accepted by freelancer, waiting for deposit
          'ACTIVE',             // Funds deposited, work in progress
          'ON_HOLD',            // Paused by mutual agreement
          'COMPLETED',          // All milestones completed
          'CANCELLED',          // Cancelled by either party
          'DISPUTED'            // Under dispute resolution
        ),
        defaultValue: 'DRAFT'
      },
      client: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: '_id'
        }
      },
      freelancer: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: '_id'
        }
      },
      milestones: {
        type: Sequelize.TEXT // Store as JSON string
      },
      progress: {
        type: Sequelize.TEXT // Store as JSON string {completed, total}
      },
      escrow: {
        type: Sequelize.TEXT // Store as JSON string with status, totalHeld, totalReleased, remaining
      },
      paymentSchedule: {
        type: Sequelize.TEXT // Store as JSON string with autoApproveDays, platformFeePercent
      },
      activityLog: {
        type: Sequelize.TEXT // Store as JSON string array
      },
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
    await queryInterface.dropTable('projects');
  }
};