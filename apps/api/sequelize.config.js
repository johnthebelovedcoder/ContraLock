const path = require('path');

// Get the path to the SQLite database file
const dbPath = path.join(__dirname, '..', '..', 'data', 'contralock.sqlite');

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: dbPath,
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  },
  production: {
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  },
};