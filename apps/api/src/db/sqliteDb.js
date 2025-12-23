const { sequelize } = require('./sequelizeModels');

// Test the connection
const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite database connected successfully');

    // Ensure data directory exists
    const fs = require('fs');
    const path = require('path');
    // The database file path is configured relative to project root, so data dir should be at project root too
    // From apps/api/src/db/ going up 4 levels to reach project root: db/../src/../api/../.. = project root
    const projectRoot = path.join(__dirname, '..', '..', '..', '..');
    const dataDir = path.join(projectRoot, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Import all models (this registers them with sequelize)
    const {
      User,
      Project,
      Milestone,
      Transaction,
      Dispute,
      Notification,
      Arbitrator
    } = require('./sequelizeModels');

    // Sync all models - create tables if they don't exist
    await sequelize.sync({ alter: true }); // Use 'alter: true' to update existing tables
    console.log('Database synchronized with all tables created');
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  initDb
};