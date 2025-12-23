// Reference the centralized User model with compatibility methods
const { User: SequelizeUser, sequelize } = require('../db/sequelizeModels');
const bcrypt = require('bcryptjs');

// Create a constructor function that will have the same interface as the Mongoose User model
function User() {
  // Constructor is empty since we're providing static methods only
}

// Add static methods for compatibility with existing code usage
User.findById = async function(id) {
  const user = await SequelizeUser.findByPk(id);
  if (user) {
    // Add the password comparison instance method to the Sequelize instance
    user.comparePassword = async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };
    return user;
  }
  return null;
};

// The findOne method for email lookups
User.findOne = async function(query) {
  if (query.email) {
    const user = await SequelizeUser.findOne({ where: { email: query.email } });
    if (user) {
      // Add the password comparison instance method to the Sequelize instance
      user.comparePassword = async function(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
      };
      return user;
    }
    return null;
  }

  const user = await SequelizeUser.findOne({ where: query });
  if (user) {
    // Add the password comparison instance method to the Sequelize instance
    user.comparePassword = async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };
    return user;
  }
  return null;
};

User.find = async function(filter = {}) {
  const users = await SequelizeUser.findAll({ where: filter });
  return users.map(user => {
    // Add the password comparison instance method to the Sequelize instance
    user.comparePassword = async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };
    return user;
  });
};

User.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await SequelizeUser.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await User.findById(id);
  }
  return null;
};

User.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await SequelizeUser.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

// Add count method for querying number of records
User.count = async function(query = {}) {
  return await SequelizeUser.count({ where: query });
};

// Add create method to match Mongoose
User.create = async function(data) {
  const user = await SequelizeUser.create({
    ...data,
    twoFactorEnabled: data.twoFactorEnabled || false,
    twoFactorSecret: data.twoFactorSecret || null,
    backupCodes: data.backupCodes || [],
    twoFactorFailedAttempts: data.twoFactorFailedAttempts || 0
  });
  // Set up the password comparison instance method
  user.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };
  return user;
};

// Add instance methods that might be used by the auth system
User.prototype.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;