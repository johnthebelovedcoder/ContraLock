// Reference the centralized Message model with compatibility methods
const { Message: SequelizeMessage } = require('../db/sequelizeModels');

// Create a constructor function that will have the same interface as the Mongoose Message model
function Message() {
  // Constructor is empty since we're providing static methods only
}

// Add static methods for compatibility with existing code usage
Message.findById = async function(id) {
  const message = await SequelizeMessage.findByPk(id);
  if (message) {
    return message;
  }
  return null;
};

Message.findOne = async function(query) {
  const message = await SequelizeMessage.findOne({ where: query });
  if (message) {
    return message;
  }
  return null;
};

Message.find = async function(filter = {}) {
  const messages = await SequelizeMessage.findAll({ where: filter });
  return messages;
};

Message.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await SequelizeMessage.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await Message.findById(id);
  }
  return null;
};

Message.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await SequelizeMessage.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

// Add count method for querying number of records
Message.count = async function(query = {}) {
  return await SequelizeMessage.count({ where: query });
};

// Add create method to match Mongoose
Message.create = async function(data) {
  const message = await SequelizeMessage.create(data);
  return message;
};

module.exports = Message;