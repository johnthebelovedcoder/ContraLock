// Audit trail model for tracking important system events
const { DataTypes, Sequelize } = require('sequelize');

// Define the Audit model
const AuditTrail = (sequelize) => {
  return sequelize.define('AuditTrail', {
    _id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'User', // Using string reference since User model might not be defined yet
        key: '_id'
      }
    },
    entityType: {
      type: DataTypes.STRING, // 'User', 'Project', 'Milestone', 'Transaction', etc.
      allowNull: true
    },
    entityId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    oldValues: {
      type: DataTypes.TEXT // Store as JSON string
    },
    newValues: {
      type: DataTypes.TEXT // Store as JSON string
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    traceId: {
      type: DataTypes.STRING, // For distributed tracing correlation
      allowNull: true
    },
    metadata: {
      type: DataTypes.TEXT // Additional metadata as JSON string
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'audit_trails',
    timestamps: false // We'll manage timestamps manually
  });
};

module.exports = AuditTrail;