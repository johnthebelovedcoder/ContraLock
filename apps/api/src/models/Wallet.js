// Reference the centralized Wallet model with compatibility methods
const { Wallet: SequelizeWallet } = require('../db/sequelizeModels');

// Create a constructor function that will have the same interface as the Mongoose Wallet model
function Wallet() {
  // Constructor is empty since we're providing static methods only
}

// Add static methods for compatibility with existing code usage
Wallet.findById = async function(id) {
  const wallet = await SequelizeWallet.findByPk(id);
  if (wallet) {
    return wallet;
  }
  return null;
};

Wallet.findOne = async function(query) {
  const wallet = await SequelizeWallet.findOne({ where: query });
  if (wallet) {
    return wallet;
  }
  return null;
};

Wallet.find = async function(filter = {}) {
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

  const wallets = await SequelizeWallet.findAll(queryOptions);
  return wallets;
};

Wallet.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await SequelizeWallet.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await Wallet.findById(id);
  }
  return null;
};

Wallet.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await SequelizeWallet.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

// Add count method for querying number of records
Wallet.count = async function(query = {}) {
  const { where } = query;
  const queryOptions = {};

  if (where) {
    queryOptions.where = where;
  }

  return await SequelizeWallet.count(queryOptions);
};

// Add create method to match Mongoose
Wallet.create = async function(data) {
  const wallet = await SequelizeWallet.create(data);
  return wallet;
};

module.exports = Wallet;