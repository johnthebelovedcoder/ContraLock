// Reference the centralized Conversation model with compatibility methods
const { Conversation: SequelizeConversation } = require('../db/sequelizeModels');

// Create a constructor function that will have the same interface as the Mongoose Conversation model
function Conversation() {
  // Constructor is empty since we're providing static methods only
}

// Add static methods for compatibility with existing code usage
Conversation.findById = async function(id) {
  const conversation = await SequelizeConversation.findByPk(id);
  if (conversation) {
    return conversation;
  }
  return null;
};

Conversation.findOne = async function(query) {
  const conversation = await SequelizeConversation.findOne({ where: query });
  if (conversation) {
    return conversation;
  }
  return null;
};

Conversation.find = async function(filter = {}) {
  const conversations = await SequelizeConversation.findAll({ where: filter });
  return conversations;
};

Conversation.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await SequelizeConversation.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await Conversation.findById(id);
  }
  return null;
};

Conversation.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await SequelizeConversation.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

// Add count method for querying number of records
Conversation.count = async function(query = {}) {
  return await SequelizeConversation.count({ where: query });
};

// Add create method to match Mongoose
Conversation.create = async function(data) {
  const conversation = await SequelizeConversation.create(data);
  return conversation;
};

module.exports = Conversation;