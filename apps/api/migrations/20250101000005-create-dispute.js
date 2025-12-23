'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('disputes', {
      _id: {
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      project: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'projects',
          key: '_id'
        }
      },
      milestone: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'milestones',
          key: '_id'
        }
      },
      raisedBy: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: '_id'
        }
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          len: [1, 1000]
        }
      },
      evidence: {
        type: Sequelize.TEXT // Store as JSON string array
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING_REVIEW',    // Initial state, awaiting system review
          'IN_MEDIATION',      // In mediation phase
          'IN_ARBITRATION',    // In arbitration phase
          'RESOLVED',          // Final resolution made
          'ESCALATED'          // Escalated to human review
        ),
        defaultValue: 'PENDING_REVIEW'
      },
      resolutionPhase: {
        type: Sequelize.ENUM('AUTO_REVIEW', 'MEDIATION', 'ARBITRATION'),
        defaultValue: 'AUTO_REVIEW'
      },
      // For automated review results
      aiAnalysis: {
        type: Sequelize.TEXT // Store as JSON string with confidenceScore, keyIssues, recommendedResolution, reasoning
      },
      // For human mediation/arbitration
      mediator: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: '_id'
        }
      },
      arbitrator: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: '_id'
        }
      },
      // Final resolution
      resolution: {
        type: Sequelize.TEXT // Store as JSON string with decision, amountToFreelancer, amountToClient, decisionReason, decidedBy, decidedAt
      },
      // Communication during dispute
      messages: {
        type: Sequelize.TEXT // Store as JSON string array
      },
      // Track dispute fee payment
      disputeFeePaid: {
        type: Sequelize.TEXT // Store as JSON string with byClient, byFreelancer, amount
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
    await queryInterface.dropTable('disputes');
  }
};