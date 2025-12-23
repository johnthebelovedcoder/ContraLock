'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('arbitrators', {
      _id: {
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      user: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: '_id'
        }
      },
      specialties: {
        type: Sequelize.TEXT // Store as JSON string array
      },
      rating: {
        type: Sequelize.TEXT // Store as JSON string with average and count
      },
      casesCompleted: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      successRate: {
        type: Sequelize.DECIMAL(5, 2), // Percentage of cases without further appeals
        defaultValue: 0
      },
      availability: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      verification: {
        type: Sequelize.TEXT // Store as JSON string with verified, verifiedAt, documents
      },
      earnings: {
        type: Sequelize.TEXT // Store as JSON string with totalEarned, pending
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
    await queryInterface.dropTable('arbitrators');
  }
};