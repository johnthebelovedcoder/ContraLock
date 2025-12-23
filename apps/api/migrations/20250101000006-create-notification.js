'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      _id: {
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: '_id'
        }
      },
      type: {
        type: Sequelize.ENUM(
          'PROJECT_INVITE',
          'MILESTONE_SUBMITTED',
          'MILESTONE_APPROVED',
          'MILESTONE_REVISION_REQUESTED',
          'PAYMENT_RELEASED',
          'DISPUTE_RAISED',
          'DISPUTE_RESOLVED',
          'PAYMENT_DUE',
          'DEADLINE_REMINDER',
          'SYSTEM_MESSAGE',
          'VERIFICATION_REQUIRED'
        ),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          len: [1, 200]
        }
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          len: [1, 1000]
        }
      },
      data: {
        type: Sequelize.TEXT // Additional data related to the notification (JSON string)
      },
      read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      readAt: Sequelize.DATE,
      relatedEntity: {
        type: Sequelize.ENUM('Project', 'Milestone', 'Dispute', 'Transaction', 'User')
      },
      relatedEntityId: Sequelize.STRING,
      priority: {
        type: Sequelize.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
        defaultValue: 'NORMAL'
      },
      sentVia: {
        type: Sequelize.TEXT // Store as JSON string array
      },
      scheduledFor: Sequelize.DATE, // For notifications that should be sent at a specific time
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
    await queryInterface.dropTable('notifications');
  }
};