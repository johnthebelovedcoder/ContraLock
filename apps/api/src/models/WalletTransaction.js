// Reference the centralized WalletTransaction model with compatibility methods
const { WalletTransaction: SequelizeWalletTransaction } = require('../db/sequelizeModels');

// Create a constructor function that will have the same interface as the Mongoose WalletTransaction model
function WalletTransaction() {
  // Constructor is empty since we're providing static methods only
}

// Add static methods for compatibility with existing code usage
WalletTransaction.findById = async function(id) {
  const transaction = await SequelizeWalletTransaction.findByPk(id);
  if (transaction) {
    return transaction;
  }
  return null;
};

WalletTransaction.findOne = async function(query) {
  const transaction = await SequelizeWalletTransaction.findOne({ where: query });
  if (transaction) {
    return transaction;
  }
  return null;
};

WalletTransaction.find = async function(filter = {}) {
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

  const transactions = await SequelizeWalletTransaction.findAll(queryOptions);
  return transactions;
};

WalletTransaction.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await SequelizeWalletTransaction.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await WalletTransaction.findById(id);
  }
  return null;
};

WalletTransaction.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await SequelizeWalletTransaction.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

// Add count method for querying number of records
WalletTransaction.count = async function(query = {}) {
  const { where } = query;
  const queryOptions = {};

  if (where) {
    queryOptions.where = where;
  }

  return await SequelizeWalletTransaction.count(queryOptions);
};

// Add create method to match Mongoose
WalletTransaction.create = async function(data) {
  const transaction = await SequelizeWalletTransaction.create(data);
  return transaction;
};

module.exports = WalletTransaction;