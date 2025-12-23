const { User, Project, Milestone, Transaction, Dispute, Notification, Message, Conversation } = require('../db/sequelizeModels');
const logger = require('../utils/logger');

class DatabaseIndexingService {
  constructor() {
    this.models = {
      User,
      Project,
      Milestone,
      Transaction,
      Dispute,
      Notification,
      Message,
      Conversation
    };
  }

  // Create all necessary database indexes
  async createIndexes() {
    try {
      logger.info('Starting database indexing process');
      
      // Create indexes for User model
      await this.createUserIndexes();
      
      // Create indexes for Project model
      await this.createProjectIndexes();
      
      // Create indexes for Milestone model
      await this.createMilestoneIndexes();
      
      // Create indexes for Transaction model
      await this.createTransactionIndexes();
      
      // Create indexes for Dispute model
      await this.createDisputeIndexes();
      
      // Create indexes for Notification model
      await this.createNotificationIndexes();
      
      // Create indexes for Message model
      await this.createMessageIndexes();
      
      // Create indexes for Conversation model
      await this.createConversationIndexes();
      
      logger.info('Database indexing completed successfully');
      
      // Log index statistics
      await this.logIndexStatistics();
    } catch (error) {
      logger.error('Error creating database indexes', { error: error.message });
      throw error;
    }
  }

  // Create indexes for User model
  async createUserIndexes() {
    try {
      // Unique index on email for faster lookups and uniqueness
      await User.sequelize.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email)'
      );
      
      // Index on role for role-based queries
      await User.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)'
      );
      
      // Index on status for status-based queries
      await User.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_users_status ON users (status)'
      );
      
      // Composite index for role and status (common query pattern)
      await User.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_users_role_status ON users (role, status)'
      );
      
      // Index on createdAt for time-based queries
      await User.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (createdAt)'
      );
      
      logger.info('User indexes created successfully');
    } catch (error) {
      logger.error('Error creating user indexes', { error: error.message });
      throw error;
    }
  }

  // Create indexes for Project model
  async createProjectIndexes() {
    try {
      // Index on client for client-based queries
      await Project.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_projects_client ON projects (client)'
      );
      
      // Index on freelancer for freelancer-based queries
      await Project.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_projects_freelancer ON projects (freelancer)'
      );
      
      // Index on status for status-based queries
      await Project.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status)'
      );
      
      // Index on deadline for deadline-based queries
      await Project.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects (deadline)'
      );
      
      // Composite index for client and status (common query pattern)
      await Project.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_projects_client_status ON projects (client, status)'
      );
      
      // Composite index for freelancer and status (common query pattern)
      await Project.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_projects_freelancer_status ON projects (freelancer, status)'
      );
      
      // Index on createdAt for time-based queries
      await Project.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (createdAt)'
      );
      
      logger.info('Project indexes created successfully');
    } catch (error) {
      logger.error('Error creating project indexes', { error: error.message });
      throw error;
    }
  }

  // Create indexes for Milestone model
  async createMilestoneIndexes() {
    try {
      // Index on project for project-based queries
      await Milestone.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones (project)'
      );
      
      // Index on status for status-based queries
      await Milestone.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones (status)'
      );
      
      // Index on deadline for deadline-based queries
      await Milestone.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_milestones_deadline ON milestones (deadline)'
      );
      
      // Composite index for project and status (common query pattern)
      await Milestone.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_milestones_project_status ON milestones (project, status)'
      );
      
      // Index on createdAt for time-based queries
      await Milestone.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_milestones_created_at ON milestones (createdAt)'
      );
      
      logger.info('Milestone indexes created successfully');
    } catch (error) {
      logger.error('Error creating milestone indexes', { error: error.message });
      throw error;
    }
  }

  // Create indexes for Transaction model
  async createTransactionIndexes() {
    try {
      // Index on projectId for project-based queries
      await Transaction.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions (projectId)'
      );
      
      // Index on milestoneId for milestone-based queries
      await Transaction.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_transactions_milestone_id ON transactions (milestoneId)'
      );
      
      // Index on from (user) for user-based queries
      await Transaction.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions ("from")'
      );
      
      // Index on to (user) for user-based queries
      await Transaction.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions ("to")'
      );
      
      // Index on type for type-based queries
      await Transaction.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type)'
      );
      
      // Index on status for status-based queries
      await Transaction.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status)'
      );
      
      // Composite index for from and type (common query pattern)
      await Transaction.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_transactions_from_type ON transactions ("from", type)'
      );
      
      // Composite index for to and type (common query pattern)
      await Transaction.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_transactions_to_type ON transactions ("to", type)'
      );
      
      // Index on createdAt for time-based queries
      await Transaction.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (createdAt)'
      );
      
      logger.info('Transaction indexes created successfully');
    } catch (error) {
      logger.error('Error creating transaction indexes', { error: error.message });
      throw error;
    }
  }

  // Create indexes for Dispute model
  async createDisputeIndexes() {
    try {
      // Index on project for project-based queries
      await Dispute.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_disputes_project ON disputes (project)'
      );
      
      // Index on milestone for milestone-based queries
      await Dispute.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_disputes_milestone ON disputes (milestone)'
      );
      
      // Index on raisedBy for user-based queries
      await Dispute.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_disputes_raised_by ON disputes (raisedBy)'
      );
      
      // Index on status for status-based queries
      await Dispute.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status)'
      );
      
      // Index on resolutionPhase for phase-based queries
      await Dispute.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_disputes_resolution_phase ON disputes (resolutionPhase)'
      );
      
      // Composite index for status and resolutionPhase (common query pattern)
      await Dispute.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_disputes_status_phase ON disputes (status, resolutionPhase)'
      );
      
      // Index on createdAt for time-based queries
      await Dispute.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes (createdAt)'
      );
      
      logger.info('Dispute indexes created successfully');
    } catch (error) {
      logger.error('Error creating dispute indexes', { error: error.message });
      throw error;
    }
  }

  // Create indexes for Notification model
  async createNotificationIndexes() {
    try {
      // Index on userId for user-based queries
      await Notification.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (userId)'
      );
      
      // Index on type for type-based queries
      await Notification.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type)'
      );
      
      // Index on read status for read/unread queries
      await Notification.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read)'
      );
      
      // Composite index for userId and type (common query pattern)
      await Notification.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications (userId, type)'
      );
      
      // Composite index for userId and read status (common query pattern)
      await Notification.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (userId, read)'
      );
      
      // Index on createdAt for time-based queries
      await Notification.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (createdAt)'
      );
      
      // Index on priority for priority-based queries
      await Notification.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications (priority)'
      );
      
      logger.info('Notification indexes created successfully');
    } catch (error) {
      logger.error('Error creating notification indexes', { error: error.message });
      throw error;
    }
  }

  // Create indexes for Message model
  async createMessageIndexes() {
    try {
      // Index on projectId for project-based queries
      await Message.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages (projectId)'
      );
      
      // Index on conversationId for conversation-based queries
      await Message.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversationId)'
      );
      
      // Index on senderId for user-based queries
      await Message.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (senderId)'
      );
      
      // Index on type for type-based queries
      await Message.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_messages_type ON messages (type)'
      );
      
      // Index on status for status-based queries
      await Message.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status)'
      );
      
      // Index on senderRole for role-based queries
      await Message.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_messages_sender_role ON messages (senderRole)'
      );
      
      // Composite index for projectId and sentAt (common query pattern for message history)
      await Message.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_messages_project_sent_at ON messages (projectId, sentAt)'
      );
      
      // Composite index for conversationId and sentAt (common query pattern for conversation messages)
      await Message.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_messages_conversation_sent_at ON messages (conversationId, sentAt)'
      );
      
      // Index on sentAt for time-based queries
      await Message.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages (sentAt)'
      );
      
      logger.info('Message indexes created successfully');
    } catch (error) {
      logger.error('Error creating message indexes', { error: error.message });
      throw error;
    }
  }

  // Create indexes for Conversation model
  async createConversationIndexes() {
    try {
      // Index on projectId for project-based queries
      await Conversation.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations (projectId)'
      );
      
      // Index on status for status-based queries
      await Conversation.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations (status)'
      );
      
      // Index on isArchived for archived conversations
      await Conversation.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations (isArchived)'
      );
      
      // Index on lastMessageAt for time-based queries
      await Conversation.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations (lastMessageAt)'
      );
      
      // Composite index for projectId and status (common query pattern)
      await Conversation.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_conversations_project_status ON conversations (projectId, status)'
      );
      
      // Index on createdAt for time-based queries
      await Conversation.sequelize.query(
        'CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations (createdAt)'
      );
      
      logger.info('Conversation indexes created successfully');
    } catch (error) {
      logger.error('Error creating conversation indexes', { error: error.message });
      throw error;
    }
  }

  // Log index statistics
  async logIndexStatistics() {
    try {
      // Count total records for each model to provide context for index usage
      const stats = {};
      
      for (const [modelName, model] of Object.entries(this.models)) {
        const count = await model.count();
        stats[modelName] = count;
      }
      
      logger.info('Database index statistics', {
        tableRecordCounts: stats,
        totalTables: Object.keys(this.models).length
      });
    } catch (error) {
      logger.error('Error logging index statistics', { error: error.message });
    }
  }

  // Analyze query performance
  async analyzeQueryPerformance() {
    try {
      logger.info('Analyzing query performance...');
      
      // Analyze the database for query optimization suggestions
      const analysis = {
        indexes: await this.getExistingIndexes(),
        queryPatterns: this.getCommonQueryPatterns(),
        optimizationSuggestions: this.getOptimizationSuggestions()
      };
      
      logger.info('Query performance analysis completed', analysis);
      return analysis;
    } catch (error) {
      logger.error('Error analyzing query performance', { error: error.message });
      throw error;
    }
  }

  // Get existing indexes
  async getExistingIndexes() {
    try {
      const indexes = {};
      
      // Get indexes for each table
      for (const [modelName, model] of Object.entries(this.models)) {
        const [results] = await model.sequelize.query(
          `SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = '${model.getTableName()}';`
        );
        indexes[modelName] = results.map(r => r.name);
      }
      
      return indexes;
    } catch (error) {
      logger.error('Error getting existing indexes', { error: error.message });
      return {};
    }
  }

  // Get common query patterns (for reference)
  getCommonQueryPatterns() {
    return {
      userQueries: [
        'Find user by email',
        'Filter users by role and status',
        'Get users created in time range'
      ],
      projectQueries: [
        'Find projects by client',
        'Find projects by freelancer',
        'Filter projects by status',
        'Get projects by deadline'
      ],
      milestoneQueries: [
        'Find milestones by project',
        'Filter milestones by status',
        'Get milestones by deadline'
      ],
      transactionQueries: [
        'Find transactions by user',
        'Filter transactions by type and status',
        'Get transactions by date range'
      ],
      messageQueries: [
        'Get messages by project',
        'Get messages by conversation',
        'Filter messages by time range'
      ]
    };
  }

  // Get optimization suggestions
  getOptimizationSuggestions() {
    return [
      'Consider adding partial indexes for frequently queried status values',
      'Monitor query performance and adjust indexes based on actual usage patterns',
      'Consider composite indexes for multi-column WHERE clauses',
      'Regular index maintenance and statistics updates',
      'Use EXPLAIN queries to verify index usage'
    ];
  }

  // Verify all indexes exist
  async verifyIndexes() {
    try {
      logger.info('Verifying database indexes...');
      
      const verificationResults = {};
      
      // This would check if the indexes actually exist in the database
      // For SQLite, we'll check the sqlite_master table
      for (const [modelName, model] of Object.entries(this.models)) {
        const tableName = model.getTableName();
        const [indexResults] = await model.sequelize.query(
          `SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = '${tableName}';`
        );
        
        verificationResults[modelName] = {
          tableName,
          indexes: indexResults.map(r => r.name),
          count: indexResults.length
        };
      }
      
      logger.info('Index verification completed', { results: verificationResults });
      return verificationResults;
    } catch (error) {
      logger.error('Error verifying indexes', { error: error.message });
      throw error;
    }
  }
}

module.exports = new DatabaseIndexingService();