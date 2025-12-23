// Reference the centralized Notification model with compatibility methods
const { Notification: SequelizeNotification } = require('../db/sequelizeModels');

// Create a constructor function that will have the same interface as the Mongoose Notification model
function Notification() {
  // Constructor is empty since we're providing static methods only
}

// Add static methods for compatibility with existing code usage
Notification.findById = async function(id) {
  const notification = await SequelizeNotification.findByPk(id);
  if (notification) {
    return notification;
  }
  return null;
};

Notification.findOne = async function(query) {
  const notification = await SequelizeNotification.findOne({ where: query });
  if (notification) {
    return notification;
  }
  return null;
};

Notification.find = async function(filter = {}) {
  const notifications = await SequelizeNotification.findAll({ where: filter });
  return notifications;
};

Notification.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await SequelizeNotification.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await Notification.findById(id);
  }
  return null;
};

Notification.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await SequelizeNotification.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

// Add count method for querying number of records
Notification.count = async function(query = {}) {
  return await SequelizeNotification.count({ where: query });
};

// Add create method to match Mongoose
Notification.create = async function(data) {
  const notification = await SequelizeNotification.create(data);
  return notification;
};

module.exports = Notification;