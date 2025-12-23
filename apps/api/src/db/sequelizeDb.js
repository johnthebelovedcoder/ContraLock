const { Sequelize } = require('sequelize');
const path = require('path');

// Get the path to the SQLite database file
const dbPath = path.join(process.cwd(), '..', '..', 'data', 'contralock.sqlite');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Sequelize: Connection to the database has been established successfully.');
    return true;
  } catch (error) {
    console.error('Sequelize: Unable to connect to the database:', error);
    return false;
  }
};

// Export the Sequelize instance and the testConnection function
module.exports = {
  sequelize,
  testConnection,
};
