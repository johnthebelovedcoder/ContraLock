'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('messages', {
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
      conversationId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'conversations',
          key: '_id'
        }
      },
      senderId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: '_id'
        }
      },
      senderRole: {
        type: Sequelize.ENUM('client', 'freelancer'),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('TEXT', 'FILE', 'NOTIFICATION'),
        defaultValue: 'TEXT'
      },
      status: {
        type: Sequelize.ENUM('SENT', 'DELIVERED', 'READ'),
        defaultValue: 'SENT'
      },
      isSystemMessage: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      parentId: {
        type: Sequelize.STRING, // For replies to a message
        allowNull: true
      },
      attachments: {
        type: Sequelize.TEXT // Store as JSON string array
      },
      readBy: {
        type: Sequelize.TEXT, // Store as JSON string array of user IDs
        defaultValue: '[]'
      },
      sentAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.dropTable('messages');
  }
};