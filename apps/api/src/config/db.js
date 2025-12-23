const { initDb } = require('../db/sqliteDb');

const connectDB = async () => {
  try {
    await initDb();
    console.log('SQLite database initialized with all tables created');

    // Set up database indexes for optimal query performance
    setTimeout(async () => {
      try {
        const { sequelize } = require('../db/sequelizeDb');
        const { createIndexes } = require('../db/indexing');
        await createIndexes(sequelize);
        console.log('Database indexes set up successfully');
      } catch (error) {
        console.error('Failed to set up database indexes:', error);
      }
    }, 1000); // Brief delay to ensure sync is completed
  } catch (error) {
    console.error(`Error initializing database: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;