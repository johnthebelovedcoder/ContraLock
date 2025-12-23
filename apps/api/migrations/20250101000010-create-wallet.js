'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('wallets', {
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
      balance: {
        type: Sequelize.INTEGER, // Amount in USD cents
        defaultValue: 0,
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'USD'
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'FROZEN', 'CLOSED'),
        defaultValue: 'ACTIVE'
      },
      lockedBalance: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalDeposited: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalWithdrawn: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.dropTable('wallets');
  }
};