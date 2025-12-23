const { DataTypes, Sequelize } = require('sequelize');
require('dotenv').config();

// Determine database configuration based on environment
const environment = process.env.NODE_ENV || 'development';

let sequelize;

if (environment === 'production' || process.env.DATABASE_URL) {
  // Use PostgreSQL for production
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DATABASE_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
    },
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    }
  });
  console.log('Using PostgreSQL database for production environment');
} else {
  // Use SQLite for development and testing
  const path = require('path');
  const fs = require('fs');

  // Define the project root explicitly - from apps/api/src/db/ we need to go up 4 levels
  // __dirname = apps/api/src/db/
  // ../ = apps/api/src/
  // ../ = apps/api/
  // ../ = apps/
  // ../ = PROJECT_ROOT
  const projectRoot = path.join(__dirname, '..', '..', '..', '..');
  const dbPath = path.join(projectRoot, 'data', 'contralock.sqlite');

  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
  }

  console.log('Database path being used:', dbPath); // Debug log

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 5,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    }
  });
}

// Define User model first since other models reference it
const User = sequelize.define('User', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
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
    type: DataTypes.ENUM('client', 'freelancer', 'admin'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'verified', 'suspended'),
    defaultValue: 'pending'
  },
  profile: {
    type: DataTypes.JSON // Store profile as JSON object
  },
  resetPasswordToken: DataTypes.STRING,
  resetPasswordExpires: DataTypes.DATE,
  emailVerificationToken: DataTypes.STRING,
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // 2FA fields
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  twoFactorSecret: DataTypes.STRING,
  twoFactorVerifiedAt: DataTypes.DATE,
  twoFactorLockedUntil: DataTypes.DATE,
  twoFactorFailedAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  backupCodes: {
    type: DataTypes.TEXT // Store as JSON string array
  },
  // Social login fields
  googleId: DataTypes.STRING,
  linkedinId: DataTypes.STRING,
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: false // We'll manage timestamps manually
});

// Define Project model
const Project = sequelize.define('Project', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'title',
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 2000]
    }
  },
  category: {
    type: DataTypes.ENUM('Design', 'Development', 'Writing', 'Marketing', 'Consulting', 'Other'),
    allowNull: false
  },
  budget: {
    type: DataTypes.INTEGER, // Amount in USD cents
    allowNull: false,
    validate: {
      min: 5000, // Minimum $50 in cents
      max: 10000000 // Maximum $100,000 in cents
    }
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'DRAFT',              // Project created but not sent
      'PENDING_ACCEPTANCE', // Invitation sent to freelancer
      'AWAITING_DEPOSIT',   // Accepted by freelancer, waiting for deposit
      'ACTIVE',             // Funds deposited, work in progress
      'ON_HOLD',            // Paused by mutual agreement
      'COMPLETED',          // All milestones completed
      'CANCELLED',          // Cancelled by either party
      'DISPUTED',           // Under dispute resolution
      'ARCHIVED'            // Archived project
    ),
    defaultValue: 'DRAFT'
  },
  client: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: '_id'
    }
  },
  freelancer: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: User,
      key: '_id'
    }
  },
  milestones: {
    type: DataTypes.TEXT // Store as JSON string
  },
  progress: {
    type: DataTypes.TEXT // Store as JSON string {completed, total}
  },
  escrow: {
    type: DataTypes.TEXT // Store as JSON string with status, totalHeld, totalReleased, remaining
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD' // Default to USD for backward compatibility
  },
  paymentSchedule: {
    type: DataTypes.TEXT // Store as JSON string with autoApproveDays, platformFeePercent
  },
  activityLog: {
    type: DataTypes.TEXT // Store as JSON string array
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
  tableName: 'projects',
  timestamps: false // We'll manage timestamps manually
});

// Define Milestone model
const Milestone = sequelize.define('Milestone', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 500]
    }
  },
  amount: {
    type: DataTypes.INTEGER, // Amount in USD cents to avoid floating point issues
    allowNull: false,
    validate: {
      min: 5000 // Minimum $50 in cents
    }
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  acceptanceCriteria: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  project: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Project,
      key: '_id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'PENDING',           // Not started
      'IN_PROGRESS',       // Freelancer working
      'SUBMITTED',         // Submitted for review
      'REVISION_REQUESTED', // Client requested changes
      'APPROVED',          // Approved by client
      'DISPUTED'           // Under dispute
    ),
    defaultValue: 'PENDING'
  },
  submittedAt: DataTypes.DATE,
  approvedAt: DataTypes.DATE,
  revisionHistory: {
    type: DataTypes.TEXT // Store as JSON string array
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD' // Default to USD for backward compatibility
  },
  deliverables: {
    type: DataTypes.TEXT // Store as JSON string array
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
  tableName: 'milestones',
  timestamps: false // We'll manage timestamps manually
});

// Define Transaction model
const Transaction = sequelize.define('Transaction', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  projectId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Project,
      key: '_id'
    }
  },
  milestoneId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: Milestone,
      key: '_id'
    }
  },
  disputeId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM(
      'DEPOSIT',           // Client deposits funds
      'MILESTONE_RELEASE', // Release payment for milestone
      'DISPUTE_REFUND',    // Refund due to dispute resolution
      'DISPUTE_PAYMENT',   // Payment due to dispute resolution
      'ADMIN_ADJUSTMENT',  // Manual adjustment by admin
      'REFUND'             // General refund
    ),
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER, // Amount in USD cents
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  from: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: User,
      key: '_id'
    }
  },
  to: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: User,
      key: '_id'
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
    defaultValue: 'PENDING'
  },
  provider: {
    type: DataTypes.STRING, // 'stripe', 'paypal', etc.
    allowNull: false
  },
  providerTransactionId: {
    type: DataTypes.STRING // ID from payment provider (e.g. Stripe)
  },
  description: DataTypes.STRING,
  fees: {
    type: DataTypes.TEXT // Store as JSON string with platform, paymentProcessor, total
  },
  processedAt: DataTypes.DATE,
  failureReason: DataTypes.STRING,
  metadata: DataTypes.TEXT, // Additional transaction-specific data (JSON string)
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'transactions',
  timestamps: false // We'll manage timestamps manually
});

// Define Dispute model
const Dispute = sequelize.define('Dispute', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  project: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Project,
      key: '_id'
    }
  },
  milestone: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Milestone,
      key: '_id'
    }
  },
  raisedBy: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: '_id'
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  evidence: {
    type: DataTypes.TEXT // Store as JSON string array
  },
  status: {
    type: DataTypes.ENUM(
      'PENDING_REVIEW',    // Initial state, awaiting system review
      'IN_MEDIATION',      // In mediation phase
      'IN_ARBITRATION',    // In arbitration phase
      'RESOLVED',          // Final resolution made
      'ESCALATED'          // Escalated to human review
    ),
    defaultValue: 'PENDING_REVIEW'
  },
  resolutionPhase: {
    type: DataTypes.ENUM('AUTO_REVIEW', 'MEDIATION', 'ARBITRATION'),
    defaultValue: 'AUTO_REVIEW'
  },
  // For automated review results
  aiAnalysis: {
    type: DataTypes.TEXT // Store as JSON string with confidenceScore, keyIssues, recommendedResolution, reasoning
  },
  // For human mediation/arbitration
  mediator: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: User,
      key: '_id'
    }
  },
  arbitrator: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: User,
      key: '_id'
    }
  },
  // Final resolution
  resolution: {
    type: DataTypes.TEXT // Store as JSON string with decision, amountToFreelancer, amountToClient, decisionReason, decidedBy, decidedAt
  },
  // Communication during dispute
  messages: {
    type: DataTypes.TEXT // Store as JSON string array
  },
  // Track dispute fee payment
  disputeFeePaid: {
    type: DataTypes.TEXT // Store as JSON string with byClient, byFreelancer, amount
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
  tableName: 'disputes',
  timestamps: false // We'll manage timestamps manually
});

// Define Notification model
const Notification = sequelize.define('Notification', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: '_id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'PROJECT_INVITE',
      'MILESTONE_SUBMITTED',
      'MILESTONE_APPROVED',
      'MILESTONE_REVISION_REQUESTED',
      'PAYMENT_RELEASED',
      'DISPUTE_RAISED',
      'DISPUTE_RESOLVED',
      'PAYMENT_DUE',
      'DEADLINE_REMINDER',
      'SYSTEM_MESSAGE',
      'VERIFICATION_REQUIRED'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  data: {
    type: DataTypes.TEXT // Additional data related to the notification (JSON string)
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: DataTypes.DATE,
  relatedEntity: {
    type: DataTypes.ENUM('Project', 'Milestone', 'Dispute', 'Transaction', 'User')
  },
  relatedEntityId: DataTypes.STRING,
  priority: {
    type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
    defaultValue: 'NORMAL'
  },
  sentVia: {
    type: DataTypes.TEXT // Store as JSON string array
  },
  scheduledFor: DataTypes.DATE, // For notifications that should be sent at a specific time
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notifications',
  timestamps: false // We'll manage timestamps manually
});

// Define Arbitrator model
const Arbitrator = sequelize.define('Arbitrator', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  user: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: '_id'
    }
  },
  specialties: {
    type: DataTypes.TEXT // Store as JSON string array
  },
  rating: {
    type: DataTypes.TEXT // Store as JSON string with average and count
  },
  casesCompleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  successRate: {
    type: DataTypes.DECIMAL(5, 2), // Percentage of cases without further appeals
    defaultValue: 0
  },
  availability: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  verification: {
    type: DataTypes.TEXT // Store as JSON string with verified, verifiedAt, documents
  },
  earnings: {
    type: DataTypes.TEXT // Store as JSON string with totalEarned, pending
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
  tableName: 'arbitrators',
  timestamps: false // We'll manage timestamps manually
});

// Define Conversation model
const Conversation = sequelize.define('Conversation', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  projectId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Project,
      key: '_id'
    }
  },
  participants: {
    type: DataTypes.TEXT, // Store as JSON string array
    allowNull: false
  },
  unreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastMessageId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastMessage: {
    type: DataTypes.TEXT, // Store last message content
    allowNull: true
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'ARCHIVED', 'DELETED'),
    defaultValue: 'ACTIVE'
  },
  isArchived: {
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
}, {
  tableName: 'conversations',
  timestamps: false // We'll manage timestamps manually
});

// Define Message model
const Message = sequelize.define('Message', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  projectId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Project,
      key: '_id'
    }
  },
  conversationId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: Conversation,
      key: '_id'
    }
  },
  senderId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: '_id'
    }
  },
  senderRole: {
    type: DataTypes.ENUM('client', 'freelancer'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('TEXT', 'FILE', 'NOTIFICATION'),
    defaultValue: 'TEXT'
  },
  status: {
    type: DataTypes.ENUM('SENT', 'DELIVERED', 'READ'),
    defaultValue: 'SENT'
  },
  isSystemMessage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  parentId: {
    type: DataTypes.STRING, // For replies to a message
    allowNull: true
  },
  attachments: {
    type: DataTypes.TEXT // Store as JSON string array
  },
  readBy: {
    type: DataTypes.TEXT, // Store as JSON string array of user IDs
    defaultValue: '[]'
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  readAt: {
    type: DataTypes.DATE,
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
  tableName: 'messages',
  timestamps: false // We'll manage timestamps manually
});

// Define module exports with compatibility wrapper methods
module.exports = {
  User,
  Project,
  Milestone,
  Transaction,
  Dispute,
  Notification,
  Arbitrator,
  Conversation,
  Message
};

// Add static methods for compatibility with Mongoose-style usage
User.findById = async function(id) {
  return await User.findByPk(id);
};

User.customFindOne = async function(query) {
  return await User.findOne({ where: query });
};

User.find = async function(filter = {}) {
  return await User.findAll({ where: filter });
};

User.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await User.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await User.findByPk(id);
  }
  return null;
};

User.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await User.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

Project.findById = async function(id) {
  return await Project.findByPk(id);
};

Project.customFindOne = async function(query) {
  return await Project.findOne({ where: query });
};

Project.find = async function(filter = {}) {
  return await Project.findAll({ where: filter });
};

Milestone.findById = async function(id) {
  return await Milestone.findByPk(id);
};

Milestone.customFindOne = async function(query) {
  return await Milestone.findOne({ where: query });
};

Milestone.find = async function(filter = {}) {
  return await Milestone.findAll({ where: filter });
};

Transaction.findById = async function(id) {
  return await Transaction.findByPk(id);
};

Transaction.customFindOne = async function(query) {
  return await Transaction.findOne({ where: query });
};

Transaction.find = async function(filter = {}) {
  return await Transaction.findAll({ where: filter });
};

Dispute.findById = async function(id) {
  return await Dispute.findByPk(id);
};

Dispute.customFindOne = async function(query) {
  return await Dispute.findOne({ where: query });
};

Dispute.find = async function(filter = {}) {
  return await Dispute.findAll({ where: filter });
};

Notification.findById = async function(id) {
  return await Notification.findByPk(id);
};

Notification.customFindOne = async function(query) {
  return await Notification.findOne({ where: query });
};

Notification.find = async function(filter = {}) {
  return await Notification.findAll({ where: filter });
};

Arbitrator.findById = async function(id) {
  return await Arbitrator.findByPk(id);
};

Arbitrator.customFindOne = async function(query) {
  return await Arbitrator.findOne({ where: query });
};

Arbitrator.find = async function(filter = {}) {
  return await Arbitrator.findAll({ where: filter });
};

Conversation.findById = async function(id) {
  return await Conversation.findByPk(id);
};

Conversation.customFindOne = async function(query) {
  return await Conversation.findOne({ where: query });
};

Conversation.find = async function(filter = {}) {
  return await Conversation.findAll({ where: filter });
};

Message.findById = async function(id) {
  return await Message.findByPk(id);
};

Message.customFindOne = async function(query) {
  return await Message.findOne({ where: query });
};

Message.find = async function(filter = {}) {
  return await Message.findAll({ where: filter });
};

// Define Wallet model
const Wallet = sequelize.define('Wallet', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: '_id'
    }
  },
  balance: {
    type: DataTypes.INTEGER, // Amount in USD cents
    defaultValue: 0,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'FROZEN', 'CLOSED'),
    defaultValue: 'ACTIVE'
  },
  lockedBalance: {
    type: DataTypes.INTEGER, // Amount currently locked in pending transactions
    defaultValue: 0
  },
  totalDeposited: {
    type: DataTypes.INTEGER, // Total amount ever deposited
    defaultValue: 0
  },
  totalWithdrawn: {
    type: DataTypes.INTEGER, // Total amount ever withdrawn
    defaultValue: 0
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
  tableName: 'wallets',
  timestamps: false // We'll manage timestamps manually
});

// Define WalletTransaction model
const WalletTransaction = sequelize.define('WalletTransaction', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  walletId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Wallet,
      key: '_id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'DEPOSIT',           // Funds added to wallet
      'WITHDRAWAL',        // Funds removed from wallet
      'TRANSFER',          // Transfer between wallets
      'PROJECT_FUNDS',     // Transfer to project escrow
      'PROJECT_REFUND',    // Funds returned from project
      'MILESTONE_PAYMENT', // Payment from wallet to freelancer
      'MILESTONE_INCOME',  // Income from completed milestone
      'REFUND',            // Refund to wallet
      'FEE',               // Platform fees
      'ADMIN_ADJUSTMENT'   // Manual adjustments by admin
    ),
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER, // Amount in USD cents
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  fromWallet: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: Wallet,
      key: '_id'
    }
  },
  toWallet: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: Wallet,
      key: '_id'
    }
  },
  relatedEntity: {
    type: DataTypes.ENUM('Project', 'Milestone', 'Transaction', 'User', 'Dispute'),
    allowNull: true
  },
  relatedEntityId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
    defaultValue: 'PENDING'
  },
  fees: {
    type: DataTypes.TEXT // Store as JSON string with platform, paymentProcessor, total
  },
  processedAt: DataTypes.DATE,
  failureReason: DataTypes.STRING,
  metadata: DataTypes.TEXT, // Additional transaction-specific data (JSON string)
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'wallet_transactions',
  timestamps: false // We'll manage timestamps manually
});

// Define AuditTrail model
const AuditTrail = sequelize.define('AuditTrail', {
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
      model: User,
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

// Add static methods for compatibility with Mongoose-style usage
User.findById = async function(id) {
  return await User.findByPk(id);
};

User.customFindOne = async function(query) {
  return await User.findOne({ where: query });
};

User.find = async function(filter = {}) {
  return await User.findAll({ where: filter });
};

User.findByIdAndUpdate = async function(id, updateData, options = {}) {
  const [updatedRowsCount] = await User.update(updateData, {
    where: { _id: id }
  });
  if (updatedRowsCount > 0) {
    return await User.findByPk(id);
  }
  return null;
};

User.updateOne = async function(query, update, options = {}) {
  const updateData = update.$set || update;
  const whereClause = query._id ? { _id: query._id } : query;
  const [updatedRowsCount] = await User.update(updateData, {
    where: whereClause
  });
  return { modifiedCount: updatedRowsCount };
};

Project.findById = async function(id) {
  return await Project.findByPk(id);
};

Project.customFindOne = async function(query) {
  return await Project.findOne({ where: query });
};

Project.find = async function(filter = {}) {
  return await Project.findAll({ where: filter });
};

Milestone.findById = async function(id) {
  return await Milestone.findByPk(id);
};

Milestone.customFindOne = async function(query) {
  return await Milestone.findOne({ where: query });
};

Milestone.find = async function(filter = {}) {
  return await Milestone.findAll({ where: filter });
};

Transaction.findById = async function(id) {
  return await Transaction.findByPk(id);
};

Transaction.customFindOne = async function(query) {
  return await Transaction.findOne({ where: query });
};

Transaction.find = async function(filter = {}) {
  return await Transaction.findAll({ where: filter });
};

Dispute.findById = async function(id) {
  return await Dispute.findByPk(id);
};

Dispute.customFindOne = async function(query) {
  return await Dispute.findOne({ where: query });
};

Dispute.find = async function(filter = {}) {
  return await Dispute.findAll({ where: filter });
};

Notification.findById = async function(id) {
  return await Notification.findByPk(id);
};

Notification.customFindOne = async function(query) {
  return await Notification.findOne({ where: query });
};

Notification.find = async function(filter = {}) {
  return await Notification.findAll({ where: filter });
};

Arbitrator.findById = async function(id) {
  return await Arbitrator.findByPk(id);
};

Arbitrator.customFindOne = async function(query) {
  return await Arbitrator.findOne({ where: query });
};

Arbitrator.find = async function(filter = {}) {
  return await Arbitrator.findAll({ where: filter });
};

Conversation.findById = async function(id) {
  return await Conversation.findByPk(id);
};

Conversation.customFindOne = async function(query) {
  return await Conversation.findOne({ where: query });
};

Conversation.find = async function(filter = {}) {
  return await Conversation.findAll({ where: filter });
};

Message.findById = async function(id) {
  return await Message.findByPk(id);
};

Message.customFindOne = async function(query) {
  return await Message.findOne({ where: query });
};

Message.find = async function(filter = {}) {
  return await Message.findAll({ where: filter });
};

Wallet.findById = async function(id) {
  return await Wallet.findByPk(id);
};

Wallet.customFindOne = async function(query) {
  return await Wallet.findOne({ where: query });
};

Wallet.find = async function(filter = {}) {
  return await Wallet.findAll({ where: filter });
};

WalletTransaction.findById = async function(id) {
  return await WalletTransaction.findByPk(id);
};

WalletTransaction.customFindOne = async function(query) {
  return await WalletTransaction.findOne({ where: query });
};

WalletTransaction.find = async function(filter = {}) {
  return await WalletTransaction.findAll({ where: filter });
};

// Export all models and the sequelize instance
module.exports = {
  sequelize, // Export the sequelize instance
  User,
  Project,
  Milestone,
  Transaction,
  Dispute,
  Notification,
  Arbitrator,
  Conversation,
  Message,
  Wallet,
  WalletTransaction,
  AuditTrail
};