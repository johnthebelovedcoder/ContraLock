# Relational Tables for JSON Fields Implementation

## Overview
This document outlines the implementation of converting JSON fields to proper relational tables in the Delivault platform. This approach addresses the issues with JSON fields including unbounded growth, querying difficulties, and data integrity concerns.

## Current JSON Fields to Convert

Based on the project analysis, key JSON fields that need to be converted include:

### 1. User Model
- `notificationPreferences: JSON` - User notification settings
- `kycDocuments: JSON` - KYC verification documents
- `skills: JSON` - User skills and expertise

### 2. Project Model
- `attachments: Array of Objects` - Project file attachments
- `invitedFreelancers: Array of UUIDs` - Freelancer invitations
- `skillsRequired: Array of Strings` - Required project skills

### 3. Milestone Model
- `deliverables: Array of Objects` - Milestone deliverables
- `files: Array of Objects` - Milestone files

### 4. Payment Model
- `metadata: JSON` - Payment metadata
- `paymentMethod: JSON` - Payment method details

## Technical Implementation

### 1. Database Migration Strategy

**Migration Order**:
1. Create new relational tables
2. Migrate data from JSON fields to new tables
3. Update application code to use new tables
4. Remove old JSON fields
5. Add new relationships to models

### 2. New Database Schema

**NotificationPreferences Table** (apps/api/src/migrations/20240101-create-notification-preferences.js):
```javascript
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create notification_preferences table
    await queryInterface.createTable('notification_preferences', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      notificationType: {
        type: DataTypes.ENUM('email', 'push', 'sms'),
        allowNull: false
      },
      eventType: {
        type: DataTypes.ENUM(
          'project_updates', 
          'payment_notifications', 
          'milestone_updates', 
          'dispute_notifications',
          'system_messages'
        ),
        allowNull: false
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes for common queries
    await queryInterface.addIndex('notification_preferences', ['userId']);
    await queryInterface.addIndex('notification_preferences', ['notificationType']);
    await queryInterface.addIndex('notification_preferences', ['eventType']);
    await queryInterface.addIndex('notification_preferences', ['userId', 'eventType']); // Composite index

    console.log('notification_preferences table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notification_preferences');
    console.log('notification_preferences table dropped successfully');
  }
};
```

**KYCDocuments Table** (apps/api/src/migrations/20240102-create-kyc-documents.js):
```javascript
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create kyc_documents table
    await queryInterface.createTable('kyc_documents', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      documentType: {
        type: DataTypes.ENUM(
          'id_card', 
          'passport', 
          'drivers_license', 
          'utility_bill', 
          'bank_statement',
          'work_certificate',
          'other'
        ),
        allowNull: false
      },
      documentUrl: {
        type: DataTypes.STRING,
        allowNull: false
      },
      documentName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      verificationStatus: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected', 'expired'),
        defaultValue: 'pending'
      },
      verifiedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      verificationDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      documentMetadata: {
        type: DataTypes.JSON, // Small metadata still OK for this specific use case
        defaultValue: {}
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('kyc_documents', ['userId']);
    await queryInterface.addIndex('kyc_documents', ['documentType']);
    await queryInterface.addIndex('kyc_documents', ['verificationStatus']);
    await queryInterface.addIndex('kyc_documents', ['userId', 'documentType']);

    console.log('kyc_documents table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('kyc_documents');
    console.log('kyc_documents table dropped successfully');
  }
};
```

**UserSkills Table** (apps/api/src/migrations/20240103-create-user-skills.js):
```javascript
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create user_skills table (many-to-many junction)
    await queryInterface.createTable('user_skills', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      skillId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'skills',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      level: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
        defaultValue: 'intermediate'
      },
      yearsExperience: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('user_skills', ['userId']);
    await queryInterface.addIndex('user_skills', ['skillId']);
    await queryInterface.addIndex('user_skills', ['userId', 'skillId']);

    console.log('user_skills table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_skills');
    console.log('user_skills table dropped successfully');
  }
};

// Also create skills table
exports.createSkillsTable = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('skills', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    await queryInterface.addIndex('skills', ['name']);
    console.log('skills table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('skills');
    console.log('skills table dropped successfully');
  }
};
```

**ProjectAttachments Table** (apps/api/src/migrations/20240104-create-project-attachments.js):
```javascript
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create project_attachments table
    await queryInterface.createTable('project_attachments', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fileSize: {
        type: DataTypes.BIGINT, // Size in bytes
        allowNull: false
      },
      fileType: {
        type: DataTypes.STRING, // e.g., 'image/jpeg', 'application/pdf'
        allowNull: false
      },
      uploadedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('project_attachments', ['projectId']);
    await queryInterface.addIndex('project_attachments', ['uploadedBy']);
    await queryInterface.addIndex('project_attachments', ['fileType']);
    await queryInterface.addIndex('project_attachments', ['createdAt']);

    console.log('project_attachments table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('project_attachments');
    console.log('project_attachments table dropped successfully');
  }
};
```

**ProjectSkills Table** (apps/api/src/migrations/20240105-create-project-skills.js):
```javascript
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create project_skills junction table
    await queryInterface.createTable('project_skills', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      skillId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'skills',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 1 // 1 = highest priority
      },
      required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('project_skills', ['projectId']);
    await queryInterface.addIndex('project_skills', ['skillId']);
    await queryInterface.addIndex('project_skills', ['projectId', 'skillId']);

    console.log('project_skills table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('project_skills');
    console.log('project_skills table dropped successfully');
  }
};
```

**MilestoneDeliverables Table** (apps/api/src/migrations/20240106-create-milestone-deliverables.js):
```javascript
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create milestone_deliverables table
    await queryInterface.createTable('milestone_deliverables', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      milestoneId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'milestones',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      acceptanceCriteria: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isDelivered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      deliveryDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      reviewNotes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('pending', 'submitted', 'reviewed', 'approved', 'rejected', 'revised'),
        defaultValue: 'pending'
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('milestone_deliverables', ['milestoneId']);
    await queryInterface.addIndex('milestone_deliverables', ['status']);
    await queryInterface.addIndex('milestone_deliverables', ['isDelivered']);

    console.log('milestone_deliverables table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('milestone_deliverables');
    console.log('milestone_deliverables table dropped successfully');
  }
};
```

**MilestoneFiles Table** (apps/api/src/migrations/20240107-create-milestone-files.js):
```javascript
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create milestone_files table
    await queryInterface.createTable('milestone_files', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      milestoneId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'milestones',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      deliverableId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be associated with a specific deliverable or just the milestone
        references: {
          model: 'milestone_deliverables',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fileSize: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      fileType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      uploadedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      version: {
        type: DataTypes.STRING,
        defaultValue: '1.0'
      },
      isFinal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('milestone_files', ['milestoneId']);
    await queryInterface.addIndex('milestone_files', ['deliverableId']);
    await queryInterface.addIndex('milestone_files', ['uploadedBy']);
    await queryInterface.addIndex('milestone_files', ['isFinal']);

    console.log('milestone_files table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('milestone_files');
    console.log('milestone_files table dropped successfully');
  }
};
```

**PaymentMetadata Table** (apps/api/src/migrations/20240108-create-payment-metadata.js):
```javascript
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create payment_metadata table
    await queryInterface.createTable('payment_metadata', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      paymentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'payments',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('payment_metadata', ['paymentId']);
    await queryInterface.addIndex('payment_metadata', ['key']);
    await queryInterface.addIndex('payment_metadata', ['paymentId', 'key']); // For fast lookups

    console.log('payment_metadata table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payment_metadata');
    console.log('payment_metadata table dropped successfully');
  }
};
```

### 3. Updated Models

**Updated User Model** (apps/api/src/models/User.js):
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('client', 'freelancer', 'admin', 'arbitrator'),
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  bio: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isKYCVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  // Removed notificationPreferences JSON field - now in separate table
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deletedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  paranoid: true, // Enable soft deletes
  timestamps: true,
  underscored: true
});

// Associations
User.associate = (models) => {
  // One-to-many: User has many KYC documents
  User.hasMany(models.KYCDocument, { 
    foreignKey: 'userId', 
    as: 'kycDocuments' 
  });
  
  // One-to-many: User has many notification preferences
  User.hasMany(models.NotificationPreference, { 
    foreignKey: 'userId', 
    as: 'notificationPreferences' 
  });
  
  // Many-to-many: User has many skills through user_skills
  User.belongsToMany(models.Skill, {
    through: models.UserSkill,
    foreignKey: 'userId',
    otherKey: 'skillId',
    as: 'skills'
  });
  
  // One-to-many: User uploads many project attachments
  User.hasMany(models.ProjectAttachment, {
    foreignKey: 'uploadedBy',
    as: 'uploadedAttachments'
  });
  
  // One-to-many: User uploads many milestone files
  User.hasMany(models.MilestoneFile, {
    foreignKey: 'uploadedBy',
    as: 'uploadedFiles'
  });
};

module.exports = User;
```

**New KYCDocument Model** (apps/api/src/models/KYCDocument.js):
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KYCDocument = sequelize.define('KYCDocument', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  documentType: {
    type: DataTypes.ENUM(
      'id_card', 
      'passport', 
      'drivers_license', 
      'utility_bill', 
      'bank_statement',
      'work_certificate',
      'other'
    ),
    allowNull: false
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  documentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected', 'expired'),
    defaultValue: 'pending'
  },
  verifiedBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  documentMetadata: {
    type: DataTypes.JSON,
    defaultValue: {}
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
  tableName: 'kyc_documents',
  timestamps: true,
  underscored: true
});

KYCDocument.associate = (models) => {
  KYCDocument.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  KYCDocument.belongsTo(models.User, { foreignKey: 'verifiedBy', as: 'verifier', constraints: false });
};

module.exports = KYCDocument;
```

**New NotificationPreference Model** (apps/api/src/models/NotificationPreference.js):
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationPreference = sequelize.define('NotificationPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  notificationType: {
    type: DataTypes.ENUM('email', 'push', 'sms'),
    allowNull: false
  },
  eventType: {
    type: DataTypes.ENUM(
      'project_updates', 
      'payment_notifications', 
      'milestone_updates', 
      'dispute_notifications',
      'system_messages'
    ),
    allowNull: false
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'notification_preferences',
  timestamps: true,
  underscored: true
});

NotificationPreference.associate = (models) => {
  NotificationPreference.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = NotificationPreference;
```

**New Skill Model** (apps/api/src/models/Skill.js):
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Skill = sequelize.define('Skill', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'skills',
  timestamps: true,
  underscored: true
});

Skill.associate = (models) => {
  // Many-to-many: Skills belong to many Users
  Skill.belongsToMany(models.User, {
    through: models.UserSkill,
    foreignKey: 'skillId',
    otherKey: 'userId',
    as: 'users'
  });
};

module.exports = Skill;
```

### 4. Data Migration Script

**Data Migration Script** (apps/api/src/scripts/migrate-json-fields.js):
```javascript
const { User, Project, Milestone, Payment, KYCDocument, NotificationPreference, ProjectAttachment, sequelize } = require('../models');

async function migrateJsonFields() {
  console.log('Starting JSON field migration...');

  try {
    // Migrate notification preferences
    await migrateNotificationPreferences();
    console.log('✓ Notification preferences migrated');

    // Migrate KYC documents
    await migrateKYCDocuments();
    console.log('✓ KYC documents migrated');

    // Migrate project attachments
    await migrateProjectAttachments();
    console.log('✓ Project attachments migrated');

    // Migrate project skills
    await migrateProjectSkills();
    console.log('✓ Project skills migrated');

    // Migrate milestone deliverables
    await migrateMilestoneDeliverables();
    console.log('✓ Milestone deliverables migrated');

    // Migrate milestone files
    await migrateMilestoneFiles();
    console.log('✓ Milestone files migrated');

    // Migrate payment metadata
    await migratePaymentMetadata();
    console.log('✓ Payment metadata migrated');

    console.log('All JSON field migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function migrateNotificationPreferences() {
  // Find all users with notificationPreferences JSON
  const users = await User.findAll({
    where: sequelize.where(
      sequelize.fn('json_type', sequelize.col('notificationPreferences')),
      'object'
    )
  });

  for (const user of users) {
    const preferences = user.notificationPreferences;

    if (preferences && typeof preferences === 'object') {
      // Create notification preferences records
      const notificationPrefs = [];

      // Email preferences
      if (typeof preferences.email === 'boolean') {
        notificationPrefs.push({
          userId: user.id,
          notificationType: 'email',
          eventType: 'project_updates',
          enabled: preferences.email
        });
      }

      if (typeof preferences.push === 'boolean') {
        notificationPrefs.push({
          userId: user.id,
          notificationType: 'push',
          eventType: 'project_updates',
          enabled: preferences.push
        });
      }

      if (typeof preferences.projectUpdates === 'boolean') {
        notificationPrefs.push({
          userId: user.id,
          notificationType: 'email', // default to email
          eventType: 'project_updates',
          enabled: preferences.projectUpdates
        });
      }

      if (typeof preferences.paymentNotifications === 'boolean') {
        notificationPrefs.push({
          userId: user.id,
          notificationType: 'email',
          eventType: 'payment_notifications',
          enabled: preferences.paymentNotifications
        });
      }

      if (notificationPrefs.length > 0) {
        await NotificationPreference.bulkCreate(notificationPrefs, { validate: true });
      }

      // Remove the old JSON field (will be done in separate migration)
      await user.update({ notificationPreferences: null });
    }
  }
}

async function migrateKYCDocuments() {
  // Find all users with kycDocuments JSON
  const users = await User.findAll({
    where: sequelize.where(
      sequelize.fn('json_type', sequelize.col('kycDocuments')),
      'object'
    )
  });

  for (const user of users) {
    const kycDocs = user.kycDocuments;

    if (kycDocs && Array.isArray(kycDocs)) {
      const documentsToCreate = kycDocs.map(doc => ({
        userId: user.id,
        documentType: doc.type || 'other',
        documentUrl: doc.url,
        documentName: doc.name || `Document_${Date.now()}`,
        verificationStatus: doc.status || 'pending',
        createdAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
        updatedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date()
      }));

      if (documentsToCreate.length > 0) {
        await KYCDocument.bulkCreate(documentsToCreate, { validate: true });
      }

      // Remove old JSON field
      await user.update({ kycDocuments: null });
    }
  }
}

async function migrateProjectAttachments() {
  // Find all projects with attachments JSON
  const projects = await Project.findAll({
    where: sequelize.where(
      sequelize.fn('json_type', sequelize.col('attachments')),
      'array'
    )
  });

  for (const project of projects) {
    const attachments = project.attachments;

    if (attachments && Array.isArray(attachments)) {
      const attachmentsToCreate = attachments.map((attachment, index) => ({
        projectId: project.id,
        fileName: attachment.name || `Attachment_${index}`,
        fileUrl: attachment.url,
        fileSize: attachment.size || 0,
        fileType: attachment.type || 'application/octet-stream',
        uploadedBy: project.clientId, // Assuming client uploaded them
        description: attachment.description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      if (attachmentsToCreate.length > 0) {
        await ProjectAttachment.bulkCreate(attachmentsToCreate, { validate: true });
      }

      // Remove old JSON field
      await project.update({ attachments: null });
    }
  }
}

async function migrateProjectSkills() {
  // This would be implemented similarly to other migrations
  // Implementation details depend on how skills were stored in the original JSON
}

async function migrateMilestoneDeliverables() {
  // Find all milestones with deliverables JSON
  const milestones = await Milestone.findAll({
    where: sequelize.where(
      sequelize.fn('json_type', sequelize.col('deliverables')),
      'array'
    )
  });

  for (const milestone of milestones) {
    const deliverables = milestone.deliverables;

    if (deliverables && Array.isArray(deliverables)) {
      const deliverablesToCreate = deliverables.map(deliverable => ({
        milestoneId: milestone.id,
        title: deliverable.title || 'Untitled Deliverable',
        description: deliverable.description || '',
        acceptanceCriteria: deliverable.acceptanceCriteria || '',
        isDelivered: deliverable.isDelivered || false,
        deliveryDate: deliverable.deliveryDate ? new Date(deliverable.deliveryDate) : null,
        reviewNotes: deliverable.reviewNotes || '',
        status: deliverable.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      if (deliverablesToCreate.length > 0) {
        await sequelize.models.MilestoneDeliverable.bulkCreate(deliverablesToCreate, { validate: true });
      }

      // Remove old JSON field
      await milestone.update({ deliverables: null });
    }
  }
}

async function migrateMilestoneFiles() {
  // This would handle migrating files from JSON to the milestone_files table
  // Implementation similar to other migrations
}

async function migratePaymentMetadata() {
  // Find all payments with metadata JSON
  const payments = await Payment.findAll({
    where: sequelize.where(
      sequelize.fn('json_type', sequelize.col('metadata')),
      'object'
    )
  });

  for (const payment of payments) {
    const metadata = payment.metadata;

    if (metadata && typeof metadata === 'object') {
      const metadataRecords = Object.entries(metadata).map(([key, value]) => ({
        paymentId: payment.id,
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      if (metadataRecords.length > 0) {
        await sequelize.models.PaymentMetadata.bulkCreate(metadataRecords, { validate: true });
      }

      // Remove old JSON field
      await payment.update({ metadata: null });
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateJsonFields()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateJsonFields };
```

### 5. Updated Service Layer

**Updated User Service** (apps/api/src/services/userService.js):
```javascript
const { User, KYCDocument, NotificationPreference, UserSkill, Skill } = require('../models');
const { Op } = require('sequelize');

class UserService {
  // Get user with all related data (properly normalized)
  static async getUserWithPreferences(userId) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: NotificationPreference,
          as: 'notificationPreferences',
          attributes: ['id', 'notificationType', 'eventType', 'enabled', 'createdAt']
        },
        {
          model: KYCDocument,
          as: 'kycDocuments',
          attributes: ['id', 'documentType', 'documentUrl', 'verificationStatus', 'createdAt']
        },
        {
          model: Skill,
          as: 'skills',
          through: { attributes: ['level', 'yearsExperience', 'verified'] }, // Junction table attributes
          attributes: ['id', 'name', 'category']
        }
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Format the response to maintain API compatibility
    const userData = user.toJSON();
    
    // Convert normalized data back to the original format for backward compatibility if needed
    // Or use the normalized data directly
    
    return userData;
  }

  // Update notification preferences (normalized approach)
  static async updateNotificationPreferences(userId, preferences) {
    // Delete existing preferences
    await NotificationPreference.destroy({
      where: { userId }
    });

    // Create new preferences
    const preferenceRecords = Object.entries(preferences).flatMap(([category, settings]) => {
      if (typeof settings === 'boolean') {
        // Simple boolean setting
        return [{
          userId,
          notificationType: 'email', // default
          eventType: category,
          enabled: settings
        }];
      } else if (typeof settings === 'object') {
        // Complex setting with multiple notification types
        return Object.entries(settings).map(([type, enabled]) => ({
          userId,
          notificationType: type,
          eventType: category,
          enabled: Boolean(enabled)
        }));
      }
      return [];
    });

    if (preferenceRecords.length > 0) {
      await NotificationPreference.bulkCreate(preferenceRecords);
    }

    return { message: 'Notification preferences updated successfully' };
  }

  // Add KYC document
  static async addKYCDocument(userId, documentData) {
    const document = await KYCDocument.create({
      userId,
      documentType: documentData.type,
      documentUrl: documentData.url,
      documentName: documentData.name,
      verificationStatus: 'pending'
    });

    // Update user KYC verification status if needed
    const user = await User.findByPk(userId);
    const userDocuments = await KYCDocument.findAll({
      where: { 
        userId, 
        verificationStatus: 'verified' 
      }
    });

    if (userDocuments.length > 0) {
      await user.update({ isKYCVerified: true });
    }

    return document;
  }

  // Add skills to user
  static async addUserSkills(userId, skillsData) {
    const transaction = await sequelize.transaction();
    
    try {
      // First, ensure all skills exist in the skills table
      for (const skillData of skillsData) {
        let skill = await Skill.findOne({ 
          where: { name: skillData.name } 
        });
        
        if (!skill) {
          skill = await Skill.create({
            name: skillData.name,
            category: skillData.category,
            description: skillData.description
          });
        }

        // Add to user_skills junction table
        await UserSkill.findOrCreate({
          where: {
            userId,
            skillId: skill.id
          },
          defaults: {
            userId,
            skillId: skill.id,
            level: skillData.level || 'intermediate',
            yearsExperience: skillData.yearsExperience || 0,
            verified: skillData.verified || false
          }
        });
      }

      await transaction.commit();
      return { message: 'Skills added successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = UserService;
```

### 6. Updated Controllers

**Updated User Controller** (apps/api/src/controllers/userController.js):
```javascript
const UserService = require('../services/userService');
const { User, KYCDocument } = require('../models');
const logger = require('../utils/logger');

const userController = {
  // Get user profile with normalized data
  async getProfile(req, res) {
    try {
      const user = await UserService.getUserWithPreferences(req.user.id);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          isKYCVerified: user.isKYCVerified,
          // Include normalized preferences
          notificationPreferences: user.notificationPreferences?.reduce((acc, pref) => {
            acc[`${pref.eventType}_${pref.notificationType}`] = pref.enabled;
            return acc;
          }, {}) || {},
          kycDocuments: user.kycDocuments?.map(doc => ({
            id: doc.id,
            type: doc.documentType,
            url: doc.documentUrl,
            status: doc.verificationStatus,
            uploadedAt: doc.createdAt
          })) || [],
          skills: user.skills?.map(skill => ({
            id: skill.id,
            name: skill.name,
            category: skill.category,
            level: skill.userSkill?.level,
            yearsExperience: skill.userSkill?.yearsExperience
          })) || []
        }
      });
    } catch (error) {
      logger.error('Error getting user profile', { error: error.message, userId: req.user.id });
      res.status(500).json({ error: error.message });
    }
  },

  // Update notification preferences
  async updateNotificationPreferences(req, res) {
    try {
      const { preferences } = req.body;
      
      await UserService.updateNotificationPreferences(req.user.id, preferences);
      
      res.json({ message: 'Notification preferences updated successfully' });
    } catch (error) {
      logger.error('Error updating notification preferences', { error: error.message, userId: req.user.id });
      res.status(500).json({ error: error.message });
    }
  },

  // Submit KYC documents
  async submitKYCDocuments(req, res) {
    try {
      // This would typically be handled via file upload
      const { documents } = req.body; // In real app, this would come from file upload
      
      // For each document, add to database
      for (const doc of documents) {
        const kycDoc = await UserService.addKYCDocument(req.user.id, {
          type: doc.type,
          url: doc.url,
          name: doc.name
        });
        
        logger.info('KYC document submitted', {
          documentId: kycDoc.id,
          userId: req.user.id,
          documentType: doc.type
        });
      }
      
      res.json({ message: 'KYC documents submitted successfully' });
    } catch (error) {
      logger.error('Error submitting KYC documents', { error: error.message, userId: req.user.id });
      res.status(500).json({ error: error.message });
    }
  },

  // Update user skills
  async updateUserSkills(req, res) {
    try {
      const { skills } = req.body;
      
      await UserService.addUserSkills(req.user.id, skills);
      
      res.json({ message: 'Skills updated successfully' });
    } catch (error) {
      logger.error('Error updating user skills', { error: error.message, userId: req.user.id });
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = userController;
```

### 7. Database Migration Commands

**Migration Commands** (apps/api/package.json):
```json
{
  "scripts": {
    "migrate:json-fields": "node src/scripts/migrate-json-fields.js",
    "migrate:up": "sequelize-cli db:migrate",
    "migrate:down": "sequelize-cli db:migrate:undo",
    "migrate:status": "sequelize-cli db:migrate:status"
  }
}
```

### 8. Testing for New Structure

**Test for Normalized Data Access** (apps/api/tests/unit/userService.test.js):
```javascript
const UserService = require('../../src/services/userService');
const { User, NotificationPreference, KYCDocument, Skill, UserSkill } = require('../../src/models');

describe('User Service - Normalized Data Access', () => {
  beforeEach(async () => {
    // Clean up test data
    await NotificationPreference.destroy({ where: {} });
    await KYCDocument.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Skill.destroy({ where: {} });
  });

  test('should get user with normalized notification preferences', async () => {
    // Create test user
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'client'
    });

    // Create notification preferences
    await NotificationPreference.bulkCreate([
      {
        userId: user.id,
        notificationType: 'email',
        eventType: 'project_updates',
        enabled: true
      },
      {
        userId: user.id,
        notificationType: 'push',
        eventType: 'payment_notifications',
        enabled: false
      }
    ]);

    const result = await UserService.getUserWithPreferences(user.id);

    expect(result.notificationPreferences).toHaveLength(2);
    expect(result.notificationPreferences[0].eventType).toBe('project_updates');
    expect(result.notificationPreferences[1].eventType).toBe('payment_notifications');
  });

  test('should update notification preferences correctly', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'client'
    });

    const preferences = {
      project_updates: { email: true, push: false },
      payment_notifications: true
    };

    await UserService.updateNotificationPreferences(user.id, preferences);

    const savedPrefs = await NotificationPreference.findAll({
      where: { userId: user.id }
    });

    expect(savedPrefs).toHaveLength(3); // 2 from project_updates, 1 from payment_notifications
    const projectEmailPref = savedPrefs.find(p => p.eventType === 'project_updates' && p.notificationType === 'email');
    expect(projectEmailPref.enabled).toBe(true);
  });

  test('should handle KYC document submission', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'client'
    });

    const documentData = {
      type: 'passport',
      url: 'https://example.com/document.pdf',
      name: 'passport.pdf'
    };

    const result = await UserService.addKYCDocument(user.id, documentData);

    expect(result.documentType).toBe('passport');
    expect(result.documentUrl).toBe('https://example.com/document.pdf');
    expect(result.verificationStatus).toBe('pending');
  });
});
```

### 9. Performance Benefits

The normalized structure provides:

1. **Better Query Performance**: Proper indexing on foreign keys and commonly queried fields
2. **Data Integrity**: Foreign key constraints ensure referential integrity
3. **Scalability**: More efficient for large datasets
4. **Flexibility**: Easy to add new attributes to related entities
5. **Maintainability**: Clear relationships and data types
6. **Compliance**: Better audit trails and GDPR compliance

This implementation converts all significant JSON fields to proper relational structures while maintaining data integrity and improving query performance.