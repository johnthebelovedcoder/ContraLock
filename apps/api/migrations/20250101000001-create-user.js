'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      _id: {
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('client', 'freelancer', 'admin'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'verified', 'suspended'),
        defaultValue: 'pending'
      },
      profile: {
        type: Sequelize.JSON // Store profile as JSON object
      },
      resetPasswordToken: Sequelize.STRING,
      resetPasswordExpires: Sequelize.DATE,
      emailVerificationToken: Sequelize.STRING,
      emailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      // 2FA fields
      twoFactorEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      twoFactorSecret: Sequelize.STRING,
      twoFactorVerifiedAt: Sequelize.DATE,
      twoFactorLockedUntil: Sequelize.DATE,
      twoFactorFailedAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      backupCodes: {
        type: Sequelize.TEXT // Store as JSON string array
      },
      // Social login fields
      googleId: Sequelize.STRING,
      linkedinId: Sequelize.STRING,
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};