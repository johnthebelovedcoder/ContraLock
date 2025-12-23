// Reference the centralized Project model with compatibility methods
const { Project: SequelizeProject } = require('../db/sequelizeModels');
const bcrypt = require('bcryptjs');

// Create a constructor function that will have the same interface as the Mongoose Project model
function Project() {
  // Constructor is empty since we're providing static methods only
}

// Add static methods for compatibility with existing code usage
Project.findById = async function(id) {
  const project = await SequelizeProject.findByPk(id);
  if (project) {
    return project;
  }
  return null;
};

Project.findOne = async function(query) {
  const project = await SequelizeProject.findOne({ where: query });
  if (project) {
    return project;
  }
  return null;
};

Project.find = async function(filter = {}) {
  const projects = await SequelizeProject.findAll({ where: filter });
  return projects;
};

Project.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await SequelizeProject.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await Project.findById(id);
  }
  return null;
};

Project.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await SequelizeProject.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

// Add count method for querying number of records
Project.count = async function(query = {}) {
  return await SequelizeProject.count({ where: query });
};

// Mongoose compatibility: Also add countDocuments which is an alias for count
Project.countDocuments = async function(query = {}) {
  return await SequelizeProject.count({ where: query });
};

// Add create method to match Mongoose
Project.create = async function(data) {
  const project = await SequelizeProject.create(data);
  return project;
};

// Add populate method for compatibility with existing code usage
Project.populate = async function(projects, populateOptions) {
  // projects can be a single instance or an array of instances
  const isArray = Array.isArray(projects);
  const projectArray = isArray ? projects : [projects];

  const populatedProjects = [];

  for (const project of projectArray) {
    // Clone the project data to avoid modifying the original
    const populatedProject = { ...project.toJSON ? project.toJSON() : project };

    for (const populateOption of Array.isArray(populateOptions) ? populateOptions : [populateOptions]) {
      if (typeof populateOption === 'string') {
        // Handle simple string format like 'client' or 'freelancer'
        if (populateOption === 'client' || populateOption === 'freelancer') {
          if (project[populateOption]) {
            const User = require('./User');
            const populatedUser = await User.findById(project[populateOption]);
            if (populatedUser) {
              const userJson = populatedUser.toJSON ? populatedUser.toJSON() : populatedUser;
              // Handle field selection for user fields if needed
              populatedProject[populateOption] = userJson;
            }
          }
        } else if (populateOption === 'milestones') {
          const Milestone = require('./Milestone');
          const milestones = await Milestone.find({ project: project._id });
          populatedProject.milestones = milestones;
        }
      } else if (typeof populateOption === 'object' && populateOption.path) {
        // Handle object format like { path: 'client', select: 'firstName lastName email' }
        const { path, select } = populateOption;
        if (path === 'client' || path === 'freelancer') {
          if (project[path]) {
            const User = require('./User');
            const populatedUser = await User.findById(project[path]);
            if (populatedUser) {
              const userJson = populatedUser.toJSON ? populatedUser.toJSON() : populatedUser;

              // Handle field selection if specified
              if (select) {
                const fields = select.split(' ').filter(f => f);
                const filteredUser = {};
                for (const field of fields) {
                  if (userJson[field] !== undefined) {
                    filteredUser[field] = userJson[field];
                  }
                }
                populatedProject[path] = filteredUser;
              } else {
                populatedProject[path] = userJson;
              }
            }
          }
        } else if (path === 'milestones') {
          const Milestone = require('./Milestone');
          const milestones = await Milestone.find({ project: project._id });
          populatedProject.milestones = milestones;
        }
      }
    }

    populatedProjects.push(populatedProject);
  }

  return isArray ? populatedProjects : populatedProjects[0];
};

module.exports = Project;