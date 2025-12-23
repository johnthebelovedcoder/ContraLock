// Reference the centralized Milestone model with compatibility methods
const { Milestone: SequelizeMilestone } = require('../db/sequelizeModels');

// Create a constructor function that will have the same interface as the Mongoose Milestone model
function Milestone() {
  // Constructor is empty since we're providing static methods only
}

// Add static methods for compatibility with existing code usage
Milestone.findById = async function(id) {
  const milestone = await SequelizeMilestone.findByPk(id);
  if (milestone) {
    return milestone;
  }
  return null;
};

Milestone.findOne = async function(query) {
  const milestone = await SequelizeMilestone.findOne({ where: query });
  if (milestone) {
    return milestone;
  }
  return null;
};

Milestone.find = async function(filter = {}) {
  const milestones = await SequelizeMilestone.findAll({ where: filter });
  return milestones;
};

Milestone.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await SequelizeMilestone.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await Milestone.findById(id);
  }
  return null;
};

Milestone.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await SequelizeMilestone.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

// Add count method for querying number of records
Milestone.count = async function(query = {}) {
  return await SequelizeMilestone.count({ where: query });
};

// Add create method to match Mongoose
Milestone.create = async function(data) {
  const milestone = await SequelizeMilestone.create(data);
  return milestone;
};

module.exports = Milestone;