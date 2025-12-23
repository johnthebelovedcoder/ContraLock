// Permission system for role-based access control
const { User } = require('../db/sequelizeModels');
const { logger } = require('../middleware/logging');

// Define permission levels and actions
const PERMISSIONS = {
  // User management permissions
  'user:read': { description: 'Read user information', roles: ['admin', 'moderator'] },
  'user:write': { description: 'Create/update user information', roles: ['admin'] },
  'user:delete': { description: 'Delete user', roles: ['admin'] },
  
  // Project management permissions
  'project:create': { description: 'Create new projects', roles: ['client', 'freelancer'] },
  'project:read': { description: 'Read project information', roles: ['client', 'freelancer', 'admin'] },
  'project:update': { description: 'Update project information', roles: ['client', 'freelancer', 'admin'] },
  'project:delete': { description: 'Delete projects', roles: ['admin'] },
  
  // Milestone management permissions
  'milestone:create': { description: 'Create new milestones', roles: ['client', 'freelancer'] },
  'milestone:read': { description: 'Read milestone information', roles: ['client', 'freelancer', 'admin'] },
  'milestone:update': { description: 'Update milestone information', roles: ['client', 'freelancer', 'admin'] },
  'milestone:submit': { description: 'Submit milestone for review', roles: ['freelancer'] },
  'milestone:approve': { description: 'Approve milestone', roles: ['client'] },
  'milestone:dispute': { description: 'Dispute milestone', roles: ['client', 'freelancer'] },
  
  // Payment management permissions
  'payment:create': { description: 'Create payments', roles: ['client'] },
  'payment:read': { description: 'Read payment information', roles: ['client', 'freelancer', 'admin'] },
  'payment:release': { description: 'Release payment from escrow', roles: ['admin', 'client'] },
  'payment:refund': { description: 'Refund payments', roles: ['admin'] },
  
  // Dispute management permissions
  'dispute:create': { description: 'Create disputes', roles: ['client', 'freelancer'] },
  'dispute:read': { description: 'Read dispute information', roles: ['client', 'freelancer', 'admin'] },
  'dispute:update': { description: 'Update dispute information', roles: ['admin', 'client', 'freelancer'] },
  'dispute:resolve': { description: 'Resolve disputes', roles: ['admin', 'arbitrator'] },
  
  // Admin permissions
  'admin:access': { description: 'Access admin panel', roles: ['admin'] },
  'admin:moderate': { description: 'Moderation capabilities', roles: ['admin', 'moderator'] },
  'admin:reports': { description: 'Access system reports', roles: ['admin'] },
  
  // File management permissions
  'file:upload': { description: 'Upload files', roles: ['client', 'freelancer'] },
  'file:download': { description: 'Download files', roles: ['client', 'freelancer', 'admin'] },
  'file:delete': { description: 'Delete files', roles: ['admin'] }
};

class PermissionService {
  constructor() {
    this.permissions = PERMISSIONS;
  }

  // Check if a user has a specific permission
  async hasPermission(userId, permission) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return false;
      }

      // Get permission definition
      const permissionDef = this.permissions[permission];
      if (!permissionDef) {
        logger.warn('Invalid permission requested', { permission, userId });
        return false;
      }

      // Check if user's role is allowed for this permission
      const hasRole = permissionDef.roles.includes(user.role);
      
      // Additional context-based checks (project ownership, etc.)
      if (hasRole) {
        return await this.contextualCheck(permission, user);
      }

      return hasRole;
    } catch (error) {
      logger.error('Permission check error', { error: error.message, userId, permission });
      return false;
    }
  }

  // Contextual permission checks (project ownership, etc.)
  async contextualCheck(permission, user) {
    // For certain actions, we might want to allow access based on ownership
    // This is a simplified version - in a real app, you'd check actual ownership
    
    switch (permission) {
      case 'project:update':
      case 'project:delete':
      case 'project:read':
        // These would typically check if the user is the project owner, freelancer, etc.
        return true; // For now, assume role-based check is sufficient
      
      default:
        return true;
    }
  }

  // Get all permissions for a user
  async getUserPermissions(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return [];
      }

      const userPermissions = [];
      for (const [permission, definition] of Object.entries(this.permissions)) {
        if (definition.roles.includes(user.role)) {
          userPermissions.push({
            permission,
            description: definition.description
          });
        }
      }

      return userPermissions;
    } catch (error) {
      logger.error('Error getting user permissions', { error: error.message, userId });
      return [];
    }
  }

  // Check if user has role
  async hasRole(userId, requiredRole) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return false;
      }

      return user.role === requiredRole;
    } catch (error) {
      logger.error('Role check error', { error: error.message, userId, requiredRole });
      return false;
    }
  }

  // Check if user has any of the specified roles
  async hasAnyRole(userId, roles) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return false;
      }

      return roles.includes(user.role);
    } catch (error) {
      logger.error('Any role check error', { error: error.message, userId, roles });
      return false;
    }
  }

  // Get all available permissions
  getAvailablePermissions() {
    return this.permissions;
  }
}

module.exports = new PermissionService();
module.exports.PermissionService = PermissionService;