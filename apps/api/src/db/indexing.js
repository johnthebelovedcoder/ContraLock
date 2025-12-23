/**
 * Database Indexing Script for DeliVault
 * This script adds proper indexes to the database to optimize common queries
 */

const { Sequelize, DataTypes } = require('sequelize');

// Import the database models
const { User, Project, Milestone, Dispute, Transaction, Notification, Message, Conversation } = require('./sequelizeModels');

async function createIndexes(sequelize) {
  console.log('Starting database indexing...');

  try {
    // Add indexes to User model
    console.log('Creating indexes for User model...');

    // Add indexes to the User model by altering the table structure
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    `);

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (email);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users (emailVerified);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email_status ON users (email, status);
    `);

    console.log('User indexes created.');

    // Add indexes to Project model
    console.log('Creating indexes for Project model...');

    // Index for user-based project queries (client and freelancer)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_client ON projects (client);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_freelancer ON projects (freelancer);
    `);

    // Index for project status queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
    `);

    // Index for combined user and status queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_client_status ON projects (client, status);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_freelancer_status ON projects (freelancer, status);
    `);

    // Index for deadline-based queries (common for project filtering)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects (deadline);
    `);

    // Index for creation date (for ordering and filtering)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (createdAt);
    `);

    // Index for project category (common filter)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_category ON projects (category);
    `);

    console.log('Project indexes created.');

    // Add indexes to Milestone model
    console.log('Creating indexes for Milestone model...');

    // Index for project-based milestone queries (common when getting milestones for a project)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones (project);
    `);

    // Index for milestone status (common query)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones (status);
    `);

    // Combined index for project and status (very common query pattern)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_milestones_project_status ON milestones (project, status);
    `);

    // Index for deadline (for milestone filtering)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_milestones_deadline ON milestones (deadline);
    `);

    // Index for creation date
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_milestones_created_at ON milestones (createdAt);
    `);

    console.log('Milestone indexes created.');

    // Add indexes to Dispute model
    console.log('Creating indexes for Dispute model...');

    // Index for project-based dispute queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_project ON disputes (project);
    `);

    // Index for milestone-based dispute queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_milestone ON disputes (milestone);
    `);

    // Index for dispute status (common query)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status);
    `);

    // Combined index for project and status
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_project_status ON disputes (project, status);
    `);

    // Index for raisedBy (user who raised the dispute)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_raised_by ON disputes (raisedBy);
    `);

    // Index for creation date
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes (createdAt);
    `);

    console.log('Dispute indexes created.');

    // Add indexes to Transaction model
    console.log('Creating indexes for Transaction model...');

    // Index for project-based transaction queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions (projectId);
    `);

    // Index for dispute-based transaction queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_dispute ON transactions (disputeId);
    `);

    // Index for transaction type (common query)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);
    `);

    // Index for transaction status
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
    `);

    // Combined index for project and type
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_project_type ON transactions (projectId, type);
    `);

    // Combined index for project and status
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_project_status ON transactions (projectId, status);
    `);

    // Index for creation date
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (createdAt);
    `);

    // Index for amount ranges (for analytics queries)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions (amount);
    `);

    console.log('Transaction indexes created.');

    // Add indexes to Notification model
    console.log('Creating indexes for Notification model...');

    // Index for user-based notification queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (userId);
    `);

    // Index for notification type
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type);
    `);

    // Index for notification read status
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications (read);
    `);

    // Combined index for user and read status (very common query pattern)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read_status ON notifications (userId, read);
    `);

    // Combined index for user and type
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications (userId, type);
    `);

    // Index for creation date
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (createdAt);
    `);

    console.log('Notification indexes created.');

    // Add indexes to Message model
    console.log('Creating indexes for Message model...');

    // Index for conversation-based message queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversationId);
    `);

    // Index for project-based message queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_project ON messages (projectId);
    `);

    // Index for sender
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (senderId);
    `);

    // Index for message type
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_type ON messages (type);
    `);

    // Index for message status/read status
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status);
    `);

    // Combined index for conversation and timestamp (for message history queries)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp ON messages (conversationId, createdAt);
    `);

    // Combined index for project and timestamp
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_project_timestamp ON messages (projectId, createdAt);
    `);

    // Index for creation date
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (createdAt);
    `);

    console.log('Message indexes created.');

    // Add indexes to Conversation model
    console.log('Creating indexes for Conversation model...');

    // Index for project-based conversation queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations (projectId);
    `);

    // Index for participants (for user-based conversation queries)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations (participants);
    `);

    // Index for conversation status
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations (status);
    `);

    // Combined index for project and status
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_project_status ON conversations (projectId, status);
    `);

    // Index for creation date
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations (createdAt);
    `);

    console.log('Conversation indexes created.');

    console.log('All database indexes created successfully!');
  } catch (error) {
    console.error('Error creating database indexes:', error);
    throw error;
  }
}

async function verifyIndexes(sequelize) {
  console.log('\nVerifying database indexes...');

  try {
    // Get all table names
    const tableNames = [
      'users', 'projects', 'milestones', 'disputes',
      'transactions', 'notifications', 'messages', 'conversations'
    ];

    for (const tableName of tableNames) {
      const indexes = await sequelize.query(`
        PRAGMA index_list("${tableName}");
      `, { type: sequelize.QueryTypes.SELECT });

      console.log(`${tableName} table has ${indexes.length} indexes:`,
        indexes.map(i => i.name).filter(name => !name.startsWith('sqlite_autoindex_')));
    }
  } catch (error) {
    console.error('Error verifying indexes:', error);
    throw error;
  }
}

// Run the indexing if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      const { sequelize } = require('./sequelizeDb');
      await createIndexes(sequelize);
      await verifyIndexes(sequelize);
      console.log('\nDatabase indexing process completed successfully!');
    } catch (error) {
      console.error('Database indexing failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  createIndexes,
  verifyIndexes
};