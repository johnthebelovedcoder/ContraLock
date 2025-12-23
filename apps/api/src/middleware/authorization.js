// Authorization middleware for role-based access control
const permissionService = require('./permissionService');
const { logger } = require('./logging');

// Middleware to check specific permissions
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user || !req.user._id) {
      logger.warn('Authorization failed - no user in request', { 
        permission, 
        url: req.originalUrl, 
        method: req.method 
      });
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPerm = await permissionService.hasPermission(req.user._id, permission);
    if (!hasPerm) {
      logger.warn('Authorization failed - insufficient permissions', { 
        userId: req.user._id, 
        permission, 
        url: req.originalUrl, 
        method: req.method 
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to check user role
const requireRole = (role) => {
  return async (req, res, next) => {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRole = await permissionService.hasRole(req.user._id, role);
    if (!hasRole) {
      logger.warn('Authorization failed - wrong role', { 
        userId: req.user._id, 
        requiredRole: role,
        actualRole: req.user.role,
        url: req.originalUrl, 
        method: req.method 
      });
      return res.status(403).json({ error: `Access denied. Required role: ${role}` });
    }

    next();
  };
};

// Middleware to check if user has any of the specified roles
const requireAnyRole = (roles) => {
  return async (req, res, next) => {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasAnyRole = await permissionService.hasAnyRole(req.user._id, roles);
    if (!hasAnyRole) {
      logger.warn('Authorization failed - no matching role', { 
        userId: req.user._id, 
        requiredRoles: roles,
        actualRole: req.user.role,
        url: req.originalUrl, 
        method: req.method 
      });
      return res.status(403).json({ 
        error: `Access denied. Required any of: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware to check resource ownership (simplified version)
const requireOwnership = (resourceType = 'user') => {
  return async (req, res, next) => {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Determine the resource ID from route parameters or request body
    const resourceId = req.params.id || req.params.userId || req.params.projectId || req.body.id;
    const userId = req.user._id;

    if (!resourceId) {
      logger.warn('Ownership check failed - no resource ID', { 
        userId, 
        resourceType,
        url: req.originalUrl 
      });
      return res.status(400).json({ error: 'Resource ID not provided' });
    }

    // This is a simplified check - in a real app you'd fetch the resource 
    // and check if the user is the owner
    // For now, assume if we're checking a user route, users can only access their own data
    if (resourceType === 'user') {
      if (resourceId !== userId) {
        logger.warn('Ownership check failed', { 
          userId, 
          resourceId,
          resourceType,
          url: req.originalUrl 
        });
        return res.status(403).json({ error: 'Access denied. You can only access your own resources.' });
      }
    }

    next();
  };
};

// Middleware to check if user is the owner of a project
const requireProjectOwnership = () => {
  return async (req, res, next) => {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const projectId = req.params.id || req.params.projectId || req.body.projectId || req.body._id;
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID not provided' });
    }

    // In a real implementation, you would fetch the project and check ownership
    // For now, we'll just pass through and assume other authorization will handle it
    // This is a placeholder for more complex ownership logic
    
    next();
  };
};

// Middleware to check if user is a project participant (client or freelancer)
const requireProjectParticipation = () => {
  return async (req, res, next) => {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const projectId = req.params.id || req.params.projectId || req.body.projectId;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID not provided' });
    }

    // In a real implementation, you would fetch the project and verify 
    // if the user is the client or freelancer assigned to this project
    // This is a placeholder for more complex project participation logic
    
    next();
  };
};

module.exports = {
  requirePermission,
  requireRole,
  requireAnyRole,
  requireOwnership,
  requireProjectOwnership,
  requireProjectParticipation
};