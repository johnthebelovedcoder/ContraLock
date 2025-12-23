# Permission/Authorization System Implementation with CASL

## Overview
This document outlines the implementation of a comprehensive permission/authorization system using CASL (Can Abilities Specific Language) for the ContraLock platform. This system will provide fine-grained access control based on user roles and permissions.

## Why CASL?

### Advantages of CASL:
- **Flexible**: Easy to define complex authorization rules
- **Type-safe**: Strong typing support (especially with TypeScript)
- **Declarative**: Clear, readable permission definitions
- **Scalable**: Can handle complex permission hierarchies
- **Performant**: Efficient permission checking
- **Well-maintained**: Active community and good documentation
- **Framework-agnostic**: Works with Express.js and other frameworks

## Technical Implementation

### 1. Installation and Setup

**Install Dependencies**:
```bash
cd apps/api
npm install @casl/ability @casl/mongoose
npm install --save-dev @types/casl  # if using TypeScript
```

### 2. User Role Definitions

**User Roles and Permissions Schema** (apps/api/src/types/roles.js):
```javascript
// Define all application roles and their hierarchy
const ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  FREELANCER: 'freelancer',
  ARBITRATOR: 'arbitrator',
  MODERATOR: 'moderator'
};

// Define all available actions
const ACTIONS = {
  MANAGE: 'manage', // All actions
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  INVITE: 'invite',
  ACCEPT_INVITATION: 'accept_invitation',
  DECLINE_INVITATION: 'decline_invitation',
  SUBMIT_MILESTONE: 'submit_milestone',
  APPROVE_MILESTONE: 'approve_milestone',
  REQUEST_REVISION: 'request_revision',
  DISPUTE_MILESTONE: 'dispute_milestone',
  PROCESS_PAYMENT: 'process_payment',
  RELEASE_PAYMENT: 'release_payment',
  WITHDRAW_FUNDS: 'withdraw_funds',
  VIEW_TRANSACTIONS: 'view_transactions',
  CREATE_DISPUTE: 'create_dispute',
  RESOLVE_DISPUTE: 'resolve_dispute',
  MEDIATE_DISPUTE: 'mediate_dispute',
  ASSIGN_ARBITRATOR: 'assign_arbitrator',
  VERIFY_DELIVERABLE: 'verify_deliverable',
  VIEW_KYC: 'view_kyc',
  UPDATE_KYC: 'update_kyc',
  VIEW_AUDIT_LOGS: 'view_audit_logs'
};

// Define all available subjects (resources)
const SUBJECTS = {
  USER: 'User',
  PROJECT: 'Project',
  MILESTONE: 'Milestone',
  PAYMENT: 'Payment',
  TRANSACTION: 'Transaction',
  DISPUTE: 'Dispute',
  MESSAGE: 'Message',
  INVITATION: 'Invitation',
  ESCROW: 'Escrow',
  INVOICE: 'Invoice',
  FILE: 'File',
  KYC: 'KYC',
  AUDIT_LOG: 'AuditLog'
};

module.exports = { ROLES, ACTIONS, SUBJECTS };
```

### 3. CASL Ability Definition

**Ability Definition** (apps/api/src/services/ability.js):
```javascript
const { AbilityBuilder, Ability } = require('@casl/ability');
const { ROLES, ACTIONS, SUBJECTS } = require('../types/roles');

/**
 * Defines user abilities based on role and additional attributes
 * @param {Object} user - The user object
 * @returns {Ability} - The CASL ability instance
 */
function defineAbilitiesFor(user) {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  // Admin has all permissions
  if (user.role === ROLES.ADMIN) {
    can(ACTIONS.MANAGE, SUBJECTS.USER);
    can(ACTIONS.MANAGE, SUBJECTS.PROJECT);
    can(ACTIONS.MANAGE, SUBJECTS.MILESTONE);
    can(ACTIONS.MANAGE, SUBJECTS.PAYMENT);
    can(ACTIONS.MANAGE, SUBJECTS.TRANSACTION);
    can(ACTIONS.MANAGE, SUBJECTS.DISPUTE);
    can(ACTIONS.MANAGE, SUBJECTS.MESSAGE);
    can(ACTIONS.MANAGE, SUBJECTS.INVITATION);
    can(ACTIONS.MANAGE, SUBJECTS.ESCROW);
    can(ACTIONS.MANAGE, SUBJECTS.INVOICE);
    can(ACTIONS.MANAGE, SUBJECTS.FILE);
    can(ACTIONS.MANAGE, SUBJECTS.KYC);
    can(ACTIONS.MANAGE, SUBJECTS.AUDIT_LOG);
  }
  // Arbitrator can resolve disputes
  else if (user.role === ROLES.ARBITRATOR) {
    can(ACTIONS.READ, SUBJECTS.DISPUTE);
    can(ACTIONS.RESOLVE_DISPUTE, SUBJECTS.DISPUTE);
    can(ACTIONS.ASSIGN_ARBITRATOR, SUBJECTS.DISPUTE);
    can(ACTIONS.READ, SUBJECTS.PROJECT);
    can(ACTIONS.READ, SUBJECTS.USER);
  }
  // Moderator can moderate content
  else if (user.role === ROLES.MODERATOR) {
    can(ACTIONS.READ, SUBJECTS.USER);
    can(ACTIONS.READ, SUBJECTS.PROJECT);
    can(ACTIONS.READ, SUBJECTS.MESSAGE);
    can(ACTIONS.READ, SUBJECTS.DISPUTE);
    can(ACTIONS.VIEW_KYC, SUBJECTS.KYC);
  }
  // Regular user (client or freelancer)
  else if (user.role === ROLES.CLIENT || user.role === ROLES.FREELANCER) {
    // Users can manage their own profile
    can(ACTIONS.READ, SUBJECTS.USER, { id: user.id });
    can(ACTIONS.UPDATE, SUBJECTS.USER, { id: user.id });
    can(ACTIONS.UPDATE, SUBJECTS.USER, { id: user.id }, ['firstName', 'lastName', 'bio', 'phone', 'avatar']);
    
    // Users can update their own KYC
    can(ACTIONS.UPDATE_KYC, SUBJECTS.KYC, { userId: user.id });
    can(ACTIONS.READ, SUBJECTS.KYC, { userId: user.id });
    
    // Users can manage their own projects
    if (user.role === ROLES.CLIENT) {
      can(ACTIONS.CREATE, SUBJECTS.PROJECT);
      can(ACTIONS.READ, SUBJECTS.PROJECT, { clientId: user.id });
      can(ACTIONS.UPDATE, SUBJECTS.PROJECT, { clientId: user.id });
      can(ACTIONS.DELETE, SUBJECTS.PROJECT, { clientId: user.id });
      
      // Clients can invite freelancers to their projects
      can(ACTIONS.INVITE, SUBJECTS.INVITATION, { projectId: { $in: user.ownProjectIds || [] } });
      
      // Clients can approve milestones in their projects
      can(ACTIONS.APPROVE_MILESTONE, SUBJECTS.MILESTONE, { projectId: { $in: user.ownProjectIds || [] } });
      can(ACTIONS.REQUEST_REVISION, SUBJECTS.MILESTONE, { projectId: { $in: user.ownProjectIds || [] } });
      can(ACTIONS.DISPUTE_MILESTONE, SUBJECTS.MILESTONE, { projectId: { $in: user.ownProjectIds || [] } });
      
      // Clients can process payments for their projects
      can(ACTIONS.PROCESS_PAYMENT, SUBJECTS.PAYMENT, { projectId: { $in: user.ownProjectIds || [] } });
      can(ACTIONS.RELEASE_PAYMENT, SUBJECTS.PAYMENT, { projectId: { $in: user.ownProjectIds || [] } });
      
      // Clients can create disputes for their projects
      can(ACTIONS.CREATE_DISPUTE, SUBJECTS.DISPUTE, { projectId: { $in: user.ownProjectIds || [] } });
      
      // Clients can view transactions related to their projects
      can(ACTIONS.VIEW_TRANSACTIONS, SUBJECTS.TRANSACTION, { userId: user.id });
    }
    
    if (user.role === ROLES.FREELANCER) {
      // Freelancers can see projects they're invited to or working on
      can(ACTIONS.READ, SUBJECTS.PROJECT, { freelancerId: user.id });
      can(ACTIONS.READ, SUBJECTS.PROJECT, { invitedFreelancers: { $in: [user.id] } });
      
      // Freelancers can accept/decline invitations
      can(ACTIONS.ACCEPT_INVITATION, SUBJECTS.INVITATION, { freelancerId: user.id });
      can(ACTIONS.DECLINE_INVITATION, SUBJECTS.INVITATION, { freelancerId: user.id });
      
      // Freelancers can work on milestones in their projects
      can(ACTIONS.SUBMIT_MILESTONE, SUBJECTS.MILESTONE, { projectId: { $in: user.assignedProjectIds || [] } });
      
      // Freelancers can withdraw funds from completed projects
      can(ACTIONS.WITHDRAW_FUNDS, SUBJECTS.PAYMENT, { userId: user.id });
      
      // Freelancers can create disputes for their projects
      can(ACTIONS.CREATE_DISPUTE, SUBJECTS.DISPUTE, { projectId: { $in: user.assignedProjectIds || [] } });
      
      // Freelancers can view their transactions
      can(ACTIONS.VIEW_TRANSACTIONS, SUBJECTS.TRANSACTION, { userId: user.id });
    }
    
    // Both clients and freelancers can manage their invitations
    can(ACTIONS.READ, SUBJECTS.INVITATION, { freelancerId: user.id });
    
    // Both can read messages in their projects
    can(ACTIONS.READ, SUBJECTS.MESSAGE, { 
      projectId: { 
        $in: [...(user.ownProjectIds || []), ...(user.assignedProjectIds || [])] 
      } 
    });
    
    // Both can read and submit disputes (but only resolve with proper role)
    can(ACTIONS.READ, SUBJECTS.DISPUTE, { 
      projectId: { 
        $in: [...(user.ownProjectIds || []), ...(user.assignedProjectIds || [])] 
      } 
    });
  }
  
  // Everyone can create users (registration)
  can(ACTIONS.CREATE, SUBJECTS.USER);
  
  // Define additional restrictions
  cannot(ACTIONS.DELETE, SUBJECTS.USER); // Users cannot delete other users
  
  return build();
}

module.exports = { defineAbilitiesFor };
```

### 4. Authorization Middleware

**Authorization Middleware** (apps/api/src/middleware/authorization.js):
```javascript
const { defineAbilitiesFor } = require('../services/ability');
const { ACTIONS, SUBJECTS } = require('../types/roles');
const logger = require('../utils/logger');

// Middleware to attach user abilities to request
const attachUserAbilities = (req, res, next) => {
  if (req.user) {
    req.ability = defineAbilitiesFor(req.user);
  }
  next();
};

// Higher-order function to create authorization middleware
const checkPermission = (action, subject, conditions = null) => {
  return (req, res, next) => {
    // If no user in request, authentication should have failed earlier
    if (!req.user || !req.ability) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has permission
    const canPerformAction = conditions 
      ? req.ability.can(action, subject, conditions)
      : req.ability.can(action, subject);

    if (!canPerformAction) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        action,
        subject,
        conditions,
        ip: req.ip
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: `${action} on ${subject}`
      });
    }

    // Log successful authorization
    logger.debug('Authorization successful', {
      userId: req.user.id,
      action,
      subject,
      conditions
    });

    next();
  };
};

// Specific middleware functions for common operations
const canReadUser = (req, res, next) => {
  const userId = req.params.id || req.body.id;
  const canAccess = req.ability.can(ACTIONS.READ, SUBJECTS.USER, { id: userId });
  
  if (!canAccess) {
    return res.status(403).json({ error: 'Cannot access this user' });
  }
  next();
};

const canUpdateUser = (req, res, next) => {
  const userId = req.params.id || req.body.id;
  const canAccess = req.ability.can(ACTIONS.UPDATE, SUBJECTS.USER, { id: userId });
  
  if (!canAccess) {
    return res.status(403).json({ error: 'Cannot update this user' });
  }
  next();
};

const canReadProject = (req, res, next) => {
  const projectId = req.params.id || req.body.projectId;
  const canAccess = req.ability.can(ACTIONS.READ, SUBJECTS.PROJECT, { id: projectId });
  
  if (!canAccess) {
    return res.status(403).json({ error: 'Cannot access this project' });
  }
  next();
};

const canUpdateProject = (req, res, next) => {
  const projectId = req.params.id || req.body.id;
  const canAccess = req.ability.can(ACTIONS.UPDATE, SUBJECTS.PROJECT, { id: projectId });
  
  if (!canAccess) {
    return res.status(403).json({ error: 'Cannot update this project' });
  }
  next();
};

const canCreateProject = (req, res, next) => {
  const canAccess = req.ability.can(ACTIONS.CREATE, SUBJECTS.PROJECT);
  
  if (!canAccess) {
    return res.status(403).json({ error: 'Cannot create projects' });
  }
  next();
};

const canManageMilestone = (req, res, next) => {
  const milestoneId = req.params.id || req.body.milestoneId;
  // This would need to check the milestone's project association
  // Implementation would depend on how the project ID is associated with the milestone
  next();
};

const canProcessPayment = (req, res, next) => {
  const projectId = req.body.projectId;
  const canAccess = req.ability.can(ACTIONS.PROCESS_PAYMENT, SUBJECTS.PAYMENT, { projectId });
  
  if (!canAccess) {
    return res.status(403).json({ error: 'Cannot process payment for this project' });
  }
  next();
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is client
const requireClient = (req, res, next) => {
  if (!req.user || req.user.role !== 'client') {
    return res.status(403).json({ error: 'Client access required' });
  }
  next();
};

// Middleware to check if user is freelancer
const requireFreelancer = (req, res, next) => {
  if (!req.user || req.user.role !== 'freelancer') {
    return res.status(403).json({ error: 'Freelancer access required' });
  }
  next();
};

module.exports = {
  attachUserAbilities,
  checkPermission,
  canReadUser,
  canUpdateUser,
  canReadProject,
  canUpdateProject,
  canCreateProject,
  canManageMilestone,
  canProcessPayment,
  requireAdmin,
  requireClient,
  requireFreelancer
};
```

### 5. Integration with Route Definitions

**Updated Route with Authorization** (apps/api/src/routes/project.js):
```javascript
const express = require('express');
const { 
  attachUserAbilities, 
  checkPermission, 
  canReadProject, 
  canUpdateProject, 
  canCreateProject 
} = require('../middleware/authorization');
const { ROLES, ACTIONS, SUBJECTS } = require('../types/roles');
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply authorization middleware to all routes
router.use(auth); // Authentication middleware first
router.use(attachUserAbilities); // Then attach user abilities

// Public routes (will be defined separately)
// router.get('/public/:id', projectController.getPublicProject);

// Protected routes with specific permissions
router.post('/', 
  canCreateProject, 
  projectController.createProject
);

router.get('/:id', 
  checkPermission(ACTIONS.READ, SUBJECTS.PROJECT), 
  projectController.getProject
);

router.put('/:id', 
  checkPermission(ACTIONS.UPDATE, SUBJECTS.PROJECT), 
  projectController.updateProject
);

router.delete('/:id', 
  checkPermission(ACTIONS.DELETE, SUBJECTS.PROJECT), 
  projectController.deleteProject
);

router.patch('/:id/status', 
  checkPermission(ACTIONS.UPDATE, SUBJECTS.PROJECT), 
  projectController.updateProjectStatus
);

router.post('/:id/invite', 
  checkPermission(ACTIONS.INVITE, SUBJECTS.INVITATION), 
  projectController.inviteFreelancer
);

router.get('/:id/milestones', 
  checkPermission(ACTIONS.READ, SUBJECTS.PROJECT), 
  projectController.getProjectMilestones
);

router.get('/search', 
  projectController.searchProjects
);

router.get('/invitations/freelancer/:freelancerId', 
  projectController.getFreelancerInvitations
);

module.exports = router;
```

### 6. Enhanced Controller with Authorization Checks

**Updated Project Controller** (apps/api/src/controllers/projectController.js):
```javascript
const { Project, User, Invitation, Milestone } = require('../models');
const { ROLES, ACTIONS, SUBJECTS } = require('../types/roles');
const logger = require('../utils/logger');

const projectController = {
  // Create project - user must have CREATE permission for PROJECT
  async createProject(req, res) {
    try {
      // Authorization is handled by middleware, but we can add additional checks
      if (req.user.role !== ROLES.CLIENT) {
        return res.status(403).json({ error: 'Only clients can create projects' });
      }

      const { title, description, budget, deadline, category, skillsRequired } = req.body;
      
      const project = await Project.create({
        title,
        description,
        clientId: req.user.id,
        budget,
        deadline,
        category,
        skillsRequired: skillsRequired || [],
        status: 'draft'
      });

      logger.info('Project created successfully', {
        projectId: project.id,
        clientId: req.user.id,
        title
      });

      res.status(201).json({ message: 'Project created successfully', project });
    } catch (error) {
      logger.error('Error creating project', { error: error.message, userId: req.user.id });
      res.status(500).json({ error: error.message });
    }
  },

  // Get project - user must have READ permission for this specific project
  async getProject(req, res) {
    try {
      const { id } = req.params;
      
      // The authorization middleware has already verified the user can read this project
      // Here we just retrieve it
      const project = await Project.findByPk(id, {
        include: [
          { model: User, as: 'client', attributes: ['id', 'email', 'firstName', 'lastName', 'avatar'] },
          { model: User, as 'freelancer', attributes: ['id', 'email', 'firstName', 'lastName', 'avatar'] }
        ]
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({ project });
    } catch (error) {
      logger.error('Error getting project', { error: error.message, projectId: req.params.id });
      res.status(500).json({ error: error.message });
    }
  },

  // Update project - user must have UPDATE permission for this specific project
  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const project = await Project.findByPk(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify the user has permission to update this specific project
      if (req.user.id !== project.clientId) {
        return res.status(403).json({ error: 'Cannot update this project' });
      }

      // Don't allow updating certain fields after project is active
      if (project.status !== 'draft' && (updateData.clientId || updateData.budget)) {
        return res.status(400).json({ error: 'Cannot update client or budget after project is active' });
      }

      await project.update(updateData);

      logger.info('Project updated successfully', {
        projectId: project.id,
        updatedBy: req.user.id
      });

      res.json({ message: 'Project updated successfully', project });
    } catch (error) {
      logger.error('Error updating project', { error: error.message, userId: req.user.id });
      res.status(500).json({ error: error.message });
    }
  },

  // Invite freelancer - user must have INVITE permission
  async inviteFreelancer(req, res) {
    try {
      const { id: projectId } = req.params;
      const { email } = req.body;

      // Verify project exists and user has rights to it
      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.clientId !== req.user.id) {
        return res.status(403).json({ error: 'Cannot invite freelancer to this project' });
      }

      // Check if freelancer exists
      const freelancer = await User.findOne({ where: { email, role: ROLES.FREELANCER } });
      if (!freelancer) {
        return res.status(404).json({ error: 'Freelancer not found or is not a freelancer' });
      }

      // Check if already invited or assigned
      if (project.freelancerId === freelancer.id || 
          project.invitedFreelancers.includes(freelancer.id)) {
        return res.status(400).json({ error: 'Freelancer already invited or assigned to this project' });
      }

      // Create invitation
      const invitation = await Invitation.create({
        projectId: project.id,
        clientId: req.user.id,
        freelancerId: freelancer.id,
        status: 'pending'
      });

      // Add to invited freelancers array
      project.invitedFreelancers = [...(project.invitedFreelancers || []), freelancer.id];
      await project.save();

      logger.info('Freelancer invited to project', {
        projectId: project.id,
        clientId: req.user.id,
        freelancerId: freelancer.id
      });

      // Add to email queue for invitation notification
      const queueService = require('../services/queueService');
      await queueService.addJob('email', 'project_invitation', {
        to: freelancer.email,
        subject: 'Project Invitation',
        template: 'projectInvitation',
        data: {
          firstName: freelancer.firstName,
          projectName: project.title,
          clientId: req.user.id,
          projectId: project.id
        }
      });

      res.json({ message: 'Freelancer invited successfully', invitation });
    } catch (error) {
      logger.error('Error inviting freelancer', { error: error.message, userId: req.user.id });
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = projectController;
```

### 7. Permission Management Interface

**Permission Management Service** (apps/api/src/services/permissionService.js):
```javascript
const { User, RolePermission } = require('../models');
const { ROLES, ACTIONS, SUBJECTS } = require('../types/roles');
const logger = require('../utils/logger');

class PermissionService {
  /**
   * Get all permissions for a user role
   */
  static async getUserPermissions(role) {
    // For built-in roles, return the static definitions
    // In a more advanced system, this would come from a database
    const permissions = this.getPermissionsForRole(role);
    return permissions;
  }

  /**
   * Static method to get permissions for a role
   */
  static getPermissionsForRole(role) {
    switch (role) {
      case ROLES.ADMIN:
        return [
          { action: ACTIONS.MANAGE, subject: SUBJECTS.USER },
          { action: ACTIONS.MANAGE, subject: SUBJECTS.PROJECT },
          { action: ACTIONS.MANAGE, subject: SUBJECTS.MILESTONE },
          { action: ACTIONS.MANAGE, subject: SUBJECTS.PAYMENT },
          { action: ACTIONS.MANAGE, subject: SUBJECTS.TRANSACTION },
          { action: ACTIONS.MANAGE, subject: SUBJECTS.DISPUTE },
          { action: ACTIONS.MANAGE, subject: SUBJECTS.AUDIT_LOG }
        ];
      case ROLES.CLIENT:
        return [
          { action: ACTIONS.CREATE, subject: SUBJECTS.PROJECT },
          { action: ACTIONS.READ, subject: SUBJECTS.PROJECT, conditions: { clientId: '{userId}' } },
          { action: ACTIONS.UPDATE, subject: SUBJECTS.PROJECT, conditions: { clientId: '{userId}' } },
          { action: ACTIONS.INVITE, subject: SUBJECTS.INVITATION },
          { action: ACTIONS.APPROVE_MILESTONE, subject: SUBJECTS.MILESTONE },
          { action: ACTIONS.PROCESS_PAYMENT, subject: SUBJECTS.PAYMENT },
          { action: ACTIONS.RELEASE_PAYMENT, subject: SUBJECTS.PAYMENT }
        ];
      case ROLES.FREELANCER:
        return [
          { action: ACTIONS.READ, subject: SUBJECTS.PROJECT, conditions: { freelancerId: '{userId}' } },
          { action: ACTIONS.SUBMIT_MILESTONE, subject: SUBJECTS.MILESTONE },
          { action: ACTIONS.WITHDRAW_FUNDS, subject: SUBJECTS.PAYMENT },
          { action: ACTIONS.CREATE_DISPUTE, subject: SUBJECTS.DISPUTE }
        ];
      default:
        return [];
    }
  }

  /**
   * Check if a user has a specific permission
   */
  static async userHasPermission(user, action, subject, conditions = {}) {
    // This would typically check against a permission database
    // For now, we'll use the CASL abilities
    const { defineAbilitiesFor } = require('./ability');
    const ability = defineAbilitiesFor(user);
    
    return ability.can(action, subject, conditions);
  }

  /**
   * Get user's capabilities summary
   */
  static async getUserCapabilities(userId) {
    const user = await User.findByPk(userId, { attributes: ['id', 'role', 'firstName', 'lastName'] });
    if (!user) {
      throw new Error('User not found');
    }

    const permissions = await this.getUserPermissions(user.role);
    
    return {
      user: {
        id: user.id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`
      },
      permissions,
      capabilities: {
        canCreateProjects: permissions.some(p => p.action === ACTIONS.CREATE && p.subject === SUBJECTS.PROJECT),
        canManageMilestones: permissions.some(p => p.action === ACTIONS.MANAGE && p.subject === SUBJECTS.MILESTONE),
        canProcessPayments: permissions.some(p => p.action === ACTIONS.PROCESS_PAYMENT && p.subject === SUBJECTS.PAYMENT),
      }
    };
  }

  /**
   * Validate permission request
   */
  static async validatePermissionRequest(userId, action, subject, resourceId = null) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const hasPermission = await this.userHasPermission(user, action, subject, resourceId ? { id: resourceId } : {});
    
    if (!hasPermission) {
      logger.warn('Permission validation failed', {
        userId,
        action,
        subject,
        resourceId,
        userRole: user.role
      });
      return false;
    }

    logger.debug('Permission validation passed', {
      userId,
      action,
      subject,
      resourceId,
      userRole: user.role
    });

    return true;
  }
}

module.exports = PermissionService;
```

### 8. Authorization Utilities

**Authorization Utilities** (apps/api/src/utils/authorization.js):
```javascript
const { defineAbilitiesFor } = require('../services/ability');
const { ACTIONS, SUBJECTS } = require('../types/roles');

/**
 * Utility function to check if a user can perform an action
 */
function canUser(user, action, subject, conditions = {}) {
  if (!user) {
    return false;
  }
  
  const ability = defineAbilitiesFor(user);
  return ability.can(action, subject, conditions);
}

/**
 * Utility function to check multiple permissions at once
 */
function userHasAllPermissions(user, permissions) {
  if (!user) {
    return false;
  }
  
  const ability = defineAbilitiesFor(user);
  
  return permissions.every(permission => {
    const { action, subject, conditions } = permission;
    return ability.can(action, subject, conditions || {});
  });
}

/**
 * Utility function to check if a user has any of the specified permissions
 */
function userHasAnyPermission(user, permissions) {
  if (!user) {
    return false;
  }
  
  const ability = defineAbilitiesFor(user);
  
  return permissions.some(permission => {
    const { action, subject, conditions } = permission;
    return ability.can(action, subject, conditions || {});
  });
}

/**
 * Get all allowed actions for a user on a specific subject
 */
function getAllowedActionsForSubject(user, subject) {
  if (!user) {
    return [];
  }
  
  const ability = defineAbilitiesFor(user);
  return ability.permittedFieldsOf(ACTIONS.MANAGE, subject);
}

/**
 * Check if user can view a resource
 */
function canUserViewResource(user, resource, resourceIdField = 'id') {
  if (!user || !resource) {
    return false;
  }
  
  // If it's a resource that belongs to the user
  if (resource.userId === user.id) {
    return true;
  }
  
  // If it's a project
  if (resource.clientId || resource.freelancerId) {
    return user.id === resource.clientId || user.id === resource.freelancerId;
  }
  
  // Use CASL for more complex checks
  const ability = defineAbilitiesFor(user);
  return ability.can(ACTIONS.READ, resource.constructor.name, { [resourceIdField]: resource.id });
}

module.exports = {
  canUser,
  userHasAllPermissions,
  userHasAnyPermission,
  getAllowedActionsForSubject,
  canUserViewResource
};
```

### 9. Testing

**Authorization Tests** (apps/api/tests/unit/authorization.test.js):
```javascript
const { defineAbilitiesFor } = require('../../src/services/ability');
const { ROLES, ACTIONS, SUBJECTS } = require('../../src/types/roles');

describe('Authorization System - CASL Abilities', () => {
  test('admin user should have all permissions', () => {
    const adminUser = {
      id: 'admin-123',
      role: ROLES.ADMIN
    };

    const abilities = defineAbilitiesFor(adminUser);

    // Admin should be able to manage everything
    expect(abilities.can(ACTIONS.MANAGE, SUBJECTS.USER)).toBe(true);
    expect(abilities.can(ACTIONS.MANAGE, SUBJECTS.PROJECT)).toBe(true);
    expect(abilities.can(ACTIONS.MANAGE, SUBJECTS.MILESTONE)).toBe(true);
    expect(abilities.can(ACTIONS.MANAGE, SUBJECTS.PAYMENT)).toBe(true);
    expect(abilities.can(ACTIONS.MANAGE, SUBJECTS.DISPUTE)).toBe(true);
  });

  test('client user should have project creation permissions', () => {
    const clientUser = {
      id: 'client-123',
      role: ROLES.CLIENT
    };

    const abilities = defineAbilitiesFor(clientUser);

    // Clients should be able to create projects
    expect(abilities.can(ACTIONS.CREATE, SUBJECTS.PROJECT)).toBe(true);
    
    // Clients should be able to read their own user profile
    expect(abilities.can(ACTIONS.READ, SUBJECTS.USER, { id: 'client-123' })).toBe(true);
    
    // Clients should NOT be able to read other users
    expect(abilities.can(ACTIONS.READ, SUBJECTS.USER, { id: 'other-user' })).toBe(false);
  });

  test('freelancer user should have limited project permissions', () => {
    const freelancerUser = {
      id: 'freelancer-123',
      role: ROLES.FREELANCER
    };

    const abilities = defineAbilitiesFor(freelancerUser);

    // Freelancers should be able to accept invitations
    expect(abilities.can(ACTIONS.ACCEPT_INVITATION, SUBJECTS.INVITATION, { freelancerId: 'freelancer-123' })).toBe(true);
    
    // Freelancers should NOT be able to create projects
    expect(abilities.can(ACTIONS.CREATE, SUBJECTS.PROJECT)).toBe(false);
  });

  test('users should have permissions to their own resources', () => {
    const user = {
      id: 'user-123',
      role: ROLES.CLIENT
    };

    const abilities = defineAbilitiesFor(user);

    // User should be able to update their own profile
    expect(abilities.can(ACTIONS.UPDATE, SUBJECTS.USER, { id: 'user-123' })).toBe(true);
    
    // User should NOT be able to update others' profiles
    expect(abilities.can(ACTIONS.UPDATE, SUBJECTS.USER, { id: 'other-user' })).toBe(false);
  });

  test('permission restrictions should be enforced', () => {
    const user = {
      id: 'user-123',
      role: ROLES.CLIENT
    };

    const abilities = defineAbilitiesFor(user);

    // Users should NOT be able to delete other users (restricted in abilities)
    expect(abilities.can(ACTIONS.DELETE, SUBJECTS.USER)).toBe(false);
  });
});
```

**Integration Tests** (apps/api/tests/integration/authorization.test.js):
```javascript
const request = require('supertest');
const app = require('../../src/app');
const { User, Project } = require('../../src/models');
const { ROLES } = require('../../src/types/roles');

describe('Authorization Middleware Integration', () => {
  let clientUser, freelancerUser, adminUser;
  let clientToken, freelancerToken, adminToken;
  let testProject;

  beforeAll(async () => {
    // Create test users
    clientUser = await User.create({
      email: 'client@test.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'Client',
      role: ROLES.CLIENT
    });

    freelancerUser = await User.create({
      email: 'freelancer@test.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'Freelancer',
      role: ROLES.FREELANCER
    });

    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'Admin',
      role: ROLES.ADMIN
    });

    // Create a test project owned by the client
    testProject = await Project.create({
      title: 'Test Project',
      description: 'Test project description',
      clientId: clientUser.id,
      budget: 1000,
      status: 'active'
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Project.destroy({ where: { id: testProject.id } });
    await User.destroy({ where: { id: [clientUser.id, freelancerUser.id, adminUser.id] } });
  });

  test('client can access their own project', async () => {
    const response = await request(app)
      .get(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(response.body.project.id).toBe(testProject.id);
  });

  test('freelancer cannot access project they are not associated with', async () => {
    const response = await request(app)
      .get(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .expect(403);

    expect(response.body.error).toBeDefined();
  });

  test('admin can access any project', async () => {
    const response = await request(app)
      .get(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.project.id).toBe(testProject.id);
  });

  test('unauthorized user cannot create project', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .send({
        title: 'Unauthorized Project',
        description: 'This should fail',
        budget: 500
      })
      .expect(401);

    expect(response.body.error).toBeDefined();
  });
});
```

### 10. Environment and Configuration

**Configuration** (apps/api/.env):
```env
# Authorization Configuration
AUTH_PERMISSION_CACHE_TTL=300  # 5 minutes cache for permissions
AUTH_PERMISSION_DEBUG_MODE=false
AUTH_PERMISSION_LOGGING=true
```

### 11. Performance Considerations

**Cache Implementation** (apps/api/src/services/permissionCache.js):
```javascript
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Cache for user abilities to improve performance
const abilityCache = new NodeCache({ 
  stdTTL: parseInt(process.env.AUTH_PERMISSION_CACHE_TTL) || 300, // 5 minutes
  checkperiod: 120, // Check for expired items every 2 minutes
  useClones: false
});

class PermissionCache {
  static getCacheKey(userId, role) {
    return `ability_${userId}_${role}`;
  }

  static getAbility(userId) {
    return abilityCache.get(this.getCacheKey(userId));
  }

  static setAbility(userId, role, ability) {
    const key = this.getCacheKey(userId, role);
    abilityCache.set(key, ability);
    logger.debug('Stored ability in cache', { userId, role });
  }

  static invalidateUserAbility(userId) {
    const key = this.getCacheKey(userId);
    abilityCache.del(key);
    logger.debug('Invalidated ability cache', { userId });
  }

  static clearAll() {
    abilityCache.flushAll();
    logger.info('Cleared all ability cache');
  }
}

module.exports = PermissionCache;
```

This implementation provides a comprehensive authorization system using CASL that:

1. Defines clear roles and permissions
2. Provides flexible ability definitions
3. Implements middleware for route protection
4. Includes utilities for permission checking
5. Provides testing coverage
6. Includes performance optimizations with caching
7. Integrates with existing authentication system

The system is designed to be secure, scalable, and maintainable while providing fine-grained access control for the Delivault platform.