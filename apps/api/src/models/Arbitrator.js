// Reference the centralized Arbitrator model with compatibility methods
const { Arbitrator: SequelizeArbitrator } = require('../db/sequelizeModels');

// Create a constructor function that will have the same interface as the Mongoose Arbitrator model
function Arbitrator() {
  // Constructor is empty since we're providing static methods only
}

// Add static methods for compatibility with existing code usage
Arbitrator.findById = async function(id) {
  const arbitrator = await SequelizeArbitrator.findByPk(id);
  if (arbitrator) {
    return arbitrator;
  }
  return null;
};

Arbitrator.findOne = async function(query) {
  const arbitrator = await SequelizeArbitrator.findOne({ where: query });
  if (arbitrator) {
    return arbitrator;
  }
  return null;
};

Arbitrator.find = async function(filter = {}) {
  const arbitrators = await SequelizeArbitrator.findAll({ where: filter });
  return arbitrators;
};

Arbitrator.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await SequelizeArbitrator.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await Arbitrator.findById(id);
  }
  return null;
};

Arbitrator.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await SequelizeArbitrator.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

// Add count method for querying number of records
Arbitrator.count = async function(query = {}) {
  return await SequelizeArbitrator.count({ where: query });
};

// Add create method to match Mongoose
Arbitrator.create = async function(data) {
  const arbitrator = await SequelizeArbitrator.create(data);
  return arbitrator;
};

module.exports = Arbitrator;