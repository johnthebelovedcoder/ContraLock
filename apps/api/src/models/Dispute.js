// Reference the centralized Dispute model with compatibility methods
const { Dispute: SequelizeDispute } = require('../db/sequelizeModels');

// Create a constructor function that will have the same interface as the Mongoose Dispute model
function Dispute() {
  // Constructor is empty since we're providing static methods only
}

// Add static methods for compatibility with existing code usage
Dispute.findById = async function(id) {
  const dispute = await SequelizeDispute.findByPk(id);
  if (dispute) {
    return dispute;
  }
  return null;
};

Dispute.findOne = async function(query) {
  const dispute = await SequelizeDispute.findOne({ where: query });
  if (dispute) {
    return dispute;
  }
  return null;
};

Dispute.find = async function(filter = {}) {
  const disputes = await SequelizeDispute.findAll({ where: filter });
  return disputes;
};

Dispute.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await SequelizeDispute.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await Dispute.findById(id);
  }
  return null;
};

Dispute.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await SequelizeDispute.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

// Add count method for querying number of records
Dispute.count = async function(query = {}) {
  return await SequelizeDispute.count({ where: query });
};

// Add create method to match Mongoose
Dispute.create = async function(data) {
  const dispute = await SequelizeDispute.create(data);
  return dispute;
};

module.exports = Dispute;