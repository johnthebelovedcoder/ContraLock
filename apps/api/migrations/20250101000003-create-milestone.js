'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('milestones', {
      _id: {
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          len: [1, 100]
        }
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          len: [1, 500]
        }
      },
      amount: {
        type: Sequelize.INTEGER, // Amount in USD cents to avoid floating point issues
        allowNull: false,
        validate: {
          min: 5000 // Minimum $50 in cents
        }
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: false
      },
      acceptanceCriteria: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          len: [1, 1000]
        }
      },
      project: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'projects',
          key: '_id'
        }
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING',           // Not started
          'IN_PROGRESS',       // Freelancer working
          'SUBMITTED',         // Submitted for review
          'REVISION_REQUESTED', // Client requested changes
          'APPROVED',          // Approved by client
          'DISPUTED'           // Under dispute
        ),
        defaultValue: 'PENDING'
      },
      submittedAt: Sequelize.DATE,
      approvedAt: Sequelize.DATE,
      revisionHistory: {
        type: Sequelize.TEXT // Store as JSON string array
      },
      deliverables: {
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
    await queryInterface.dropTable('milestones');
  }
};