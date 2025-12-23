// Reference the centralized Transaction model with compatibility methods
const { Transaction: SequelizeTransaction } = require('../db/sequelizeModels');

// Create a constructor function that will have the same interface as the Mongoose Transaction model
function Transaction() {
  // Constructor is empty since we're providing static methods only
}

// Add static methods for compatibility with existing code usage
Transaction.findById = async function(id) {
  const transaction = await SequelizeTransaction.findByPk(id);
  if (transaction) {
    return transaction;
  }
  return null;
};

Transaction.findOne = async function(query) {
  const transaction = await SequelizeTransaction.findOne({ where: query });
  if (transaction) {
    return transaction;
  }
  return null;
};

Transaction.find = async function(filter = {}) {
  const { where, order, limit, offset } = filter;
  const queryOptions = {};

  if (where) {
    queryOptions.where = where;
  }

  if (order) {
    queryOptions.order = order;
  }

  if (limit) {
    queryOptions.limit = parseInt(limit);
  }

  if (offset) {
    queryOptions.offset = parseInt(offset);
  }

  const transactions = await SequelizeTransaction.findAll(queryOptions);
  return transactions;
};

Transaction.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await SequelizeTransaction.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await Transaction.findById(id);
  }
  return null;
};

Transaction.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await SequelizeTransaction.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

// Add count method for querying number of records
Transaction.count = async function(query = {}) {
  const { where } = query;
  const queryOptions = {};

  if (where) {
    queryOptions.where = where;
  }

  return await SequelizeTransaction.count(queryOptions);
};

// Add create method to match Mongoose
Transaction.create = async function(data) {
  const transaction = await SequelizeTransaction.create(data);
  return transaction;
};

module.exports = Transaction;