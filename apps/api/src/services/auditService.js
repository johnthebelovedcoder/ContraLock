// Audit service for tracking important system events
const { AuditTrail } = require('../db/sequelizeModels');
const { logger } = require('../middleware/logging');
const { Op } = require('sequelize');

class AuditService {
  constructor() {
    this.enabled = process.env.AUDIT_ENABLED !== 'false';
  }

  // Log an audit event
  async logEvent(action, userId, entityType, entityId, context = {}) {
    if (!this.enabled) {
      return;
    }

    try {
      const auditEntry = await AuditTrail.create({
        action,
        userId,
        entityType,
        entityId,
        oldValues: context.oldValues ? JSON.stringify(context.oldValues) : null,
        newValues: context.newValues ? JSON.stringify(context.newValues) : null,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
        traceId: context.traceId || null,
        metadata: context.metadata ? JSON.stringify(context.metadata) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      logger.info('Audit event logged', {
        auditId: auditEntry._id,
        action,
        userId,
        entityType,
        entityId
      });

      return auditEntry;
    } catch (error) {
      logger.error('Failed to log audit event', {
        error: error.message,
        action,
        userId,
        entityType,
        entityId
      });
      // Don't throw error as audit logging shouldn't break the main flow
    }
  }

  // Log financial transaction event
  async logFinancialEvent(transactionType, userId, transactionId, details) {
    return await this.logEvent(
      `FINANCIAL_${transactionType.toUpperCase()}`,
      userId,
      'Transaction',
      transactionId,
      details
    );
  }

  // Log user-related events
  async logUserEvent(action, userId, targetUserId, details = {}) {
    return await this.logEvent(
      `USER_${action.toUpperCase()}`,
      userId,
      'User',
      targetUserId,
      details
    );
  }

  // Log project-related events
  async logProjectEvent(action, userId, projectId, details = {}) {
    return await this.logEvent(
      `PROJECT_${action.toUpperCase()}`,
      userId,
      'Project',
      projectId,
      details
    );
  }

  // Log milestone-related events
  async logMilestoneEvent(action, userId, milestoneId, details = {}) {
    return await this.logEvent(
      `MILESTONE_${action.toUpperCase()}`,
      userId,
      'Milestone',
      milestoneId,
      details
    );
  }

  // Log dispute-related events
  async logDisputeEvent(action, userId, disputeId, details = {}) {
    return await this.logEvent(
      `DISPUTE_${action.toUpperCase()}`,
      userId,
      'Dispute',
      disputeId,
      details
    );
  }

  // Search audit trails
  async searchAuditLogs(filters = {}, limit = 100, offset = 0) {
    const whereClause = {};

    if (filters.action) whereClause.action = { [Op.iLike]: `%${filters.action}%` };
    if (filters.userId) whereClause.userId = filters.userId;
    if (filters.entityType) whereClause.entityType = filters.entityType;
    if (filters.entityId) whereClause.entityId = filters.entityId;
    if (filters.fromDate) whereClause.createdAt = { [Op.gte]: filters.fromDate };
    if (filters.toDate) whereClause.createdAt = { ...whereClause.createdAt, [Op.lte]: filters.toDate };

    try {
      const results = await AuditTrail.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return results;
    } catch (error) {
      logger.error('Failed to search audit logs', { error: error.message, filters });
      throw error;
    }
  }

  // Get audit trail for specific entity
  async getEntityAuditTrail(entityType, entityId, limit = 50) {
    try {
      const results = await AuditTrailModel.findAll({
        where: { entityType, entityId },
        limit,
        order: [['createdAt', 'DESC']]
      });

      return results;
    } catch (error) {
      logger.error('Failed to get entity audit trail', { 
        error: error.message, 
        entityType, 
        entityId 
      });
      throw error;
    }
  }

  // Get user's audit trail
  async getUserAuditTrail(userId, limit = 50) {
    try {
      const results = await AuditTrailModel.findAll({
        where: { userId },
        limit,
        order: [['createdAt', 'DESC']]
      });

      return results;
    } catch (error) {
      logger.error('Failed to get user audit trail', { 
        error: error.message, 
        userId 
      });
      throw error;
    }
  }
}

module.exports = new AuditService();
module.exports.AuditService = AuditService;