'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('conversations', {
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
      participants: {
        type: Sequelize.TEXT, // Store as JSON string array
        allowNull: false
      },
      unreadCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastMessageId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastMessage: {
        type: Sequelize.TEXT, // Store last message content
        allowNull: true
      },
      lastMessageAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'ARCHIVED', 'DELETED'),
        defaultValue: 'ACTIVE'
      },
      isArchived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('conversations');
  }
};