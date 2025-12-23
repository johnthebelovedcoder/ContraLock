// This file provides backward compatibility for the old model imports
// It now references our new compatibility wrapper models

const { sequelize } = require('../db/sequelizeModels');

module.exports = {
  User: require('./User'),
  Project: require('./Project'),
  Milestone: require('./Milestone'),
  Transaction: require('./Transaction'),
  Dispute: require('./Dispute'),
  Notification: require('./Notification'),
  Arbitrator: require('./Arbitrator'),
  Conversation: require('./Conversation'),
  Message: require('./Message'),
  Wallet: require('./Wallet'),
  WalletTransaction: require('./WalletTransaction'),
  sequelize // Export the sequelize instance for database operations
};