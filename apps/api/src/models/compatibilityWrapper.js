// src/models/compatibilityWrapper.js
// This file provides a compatibility layer for Mongoose-style methods using Sequelize

const User = require('./User');
const Project = require('./Project');
const Milestone = require('./Milestone');
const Transaction = require('./Transaction');
const Dispute = require('./Dispute');
const Notification = require('./Notification');
const Arbitrator = require('./Arbitrator');

// User model wrapper functions
const UserWrapper = {
  // Find user by email
  findOne: async function(query) {
    if (query.email) {
      return await User.findOne({ where: { email: query.email } });
    }
    return null;
  },

  // Find user by ID
  findById: async function(id) {
    return await User.findByPk(id);
  },

  // Find all users with filter
  find: async function(filter = {}) {
    return await User.findAll({ where: filter });
  },

  // Create new user
  create: async function(userData) {
    return await User.create(userData);
  },

  // Update user
  updateOne: async function(query, update, options = {}) {
    if (query._id) {
      const updateData = update.$set || update;
      return await User.update(updateData, { 
        where: { _id: query._id },
        returning: true
      });
    }
    return null;
  },

  // Update user by ID
  findByIdAndUpdate: async function(id, updateData, options = {}) {
    return await User.update(updateData, { 
      where: { _id: id },
      returning: true,
      plain: true
    });
  },

  // Delete user
  deleteOne: async function(query) {
    if (query._id) {
      return await User.destroy({ where: { _id: query._id } });
    }
    return 0;
  }
};

// Project model wrapper functions
const ProjectWrapper = {
  // Find by ID
  findById: async function(id) {
    return await Project.findByPk(id);
  },

  // Find with filter
  find: async function(filter = {}) {
    return await Project.findAll({ where: filter });
  },

  // Find one with filter
  findOne: async function(filter = {}) {
    return await Project.findOne({ where: filter });
  },

  // Create project
  create: async function(projectData) {
    return await Project.create(projectData);
  },

  // Update project
  updateOne: async function(query, update, options = {}) {
    if (query._id) {
      const updateData = update.$set || update;
      return await Project.update(updateData, {
        where: { _id: query._id },
        returning: true
      });
    }
    return null;
  }
};

// Milestone model wrapper functions
const MilestoneWrapper = {
  // Find by ID
  findById: async function(id) {
    return await Milestone.findByPk(id);
  },

  // Find with filter
  find: async function(filter = {}) {
    return await Milestone.findAll({ where: filter });
  },

  // Find one with filter
  findOne: async function(filter = {}) {
    return await Milestone.findOne({ where: filter });
  }
};

// Transaction model wrapper functions
const TransactionWrapper = {
  // Find by ID
  findById: async function(id) {
    return await Transaction.findByPk(id);
  },

  // Find with filter
  find: async function(filter = {}) {
    return await Transaction.findAll({ where: filter });
  },

  // Find one with filter
  findOne: async function(filter = {}) {
    return await Transaction.findOne({ where: filter });
  }
};

// Dispute model wrapper functions
const DisputeWrapper = {
  // Find by ID
  findById: async function(id) {
    return await Dispute.findByPk(id);
  },

  // Find with filter
  find: async function(filter = {}) {
    return await Dispute.findAll({ where: filter });
  },

  // Find one with filter
  findOne: async function(filter = {}) {
    return await Dispute.findOne({ where: filter });
  }
};

// Notification model wrapper functions
const NotificationWrapper = {
  // Find by ID
  findById: async function(id) {
    return await Notification.findByPk(id);
  },

  // Find with filter
  find: async function(filter = {}) {
    return await Notification.findAll({ where: filter });
  },

  // Find one with filter
  findOne: async function(filter = {}) {
    return await Notification.findOne({ where: filter });
  }
};

module.exports = {
  User: UserWrapper,
  Project: ProjectWrapper,
  Milestone: MilestoneWrapper,
  Transaction: TransactionWrapper,
  Dispute: DisputeWrapper,
  Notification: NotificationWrapper,
  Arbitrator: ArbitratorWrapper // I missed defining this, I'll add it below
};

// Arbitrator model wrapper functions
const ArbitratorWrapper = {
  // Find by ID
  findById: async function(id) {
    return await Arbitrator.findByPk(id);
  },

  // Find with filter
  find: async function(filter = {}) {
    return await Arbitrator.findAll({ where: filter });
  },

  // Find one with filter
  findOne: async function(filter = {}) {
    return await Arbitrator.findOne({ where: filter });
  }
};