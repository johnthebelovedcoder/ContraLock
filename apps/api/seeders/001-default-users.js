'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash the default passwords
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create default users
    await queryInterface.bulkInsert('users', [
      {
        _id: 'user-1',
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'verified',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user-2',
        email: 'client@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Client',
        role: 'client',
        status: 'verified',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user-3',
        email: 'freelancer@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Freelancer',
        role: 'freelancer',
        status: 'verified',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user-4',
        email: 'freelancer1@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Freelancer',
        role: 'freelancer',
        status: 'verified',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: ['admin@example.com', 'client@example.com', 'freelancer@example.com', 'freelancer1@test.com']
    }, {});
  }
};