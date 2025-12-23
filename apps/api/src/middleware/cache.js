const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // Default TTL of 10 minutes

// Cache middleware for GET requests
const cacheMiddleware = (duration = 600) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query parameters
    const key = req.originalUrl;
    const cachedData = cache.get(key);

    if (cachedData) {
      // Send cached data if available
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Cache the response data
      cache.set(key, data, duration);
      originalJson.call(this, data);
    };

    next();
  };
};

// Cache single user data by ID
const cacheUser = (req, res, next) => {
  const userId = req.params.id;
  if (userId) {
    const key = `user:${userId}`;
    const cachedData = cache.get(key);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    // Override res.json to cache user data
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(key, data, 300); // Cache user data for 5 minutes
      originalJson.call(this, data);
    };
  }
  next();
};

// Cache single project data by ID
const cacheProject = (req, res, next) => {
  const projectId = req.params.id;
  if (projectId) {
    const key = `project:${projectId}`;
    const cachedData = cache.get(key);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    // Override res.json to cache project data
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(key, data, 300); // Cache project data for 5 minutes
      originalJson.call(this, data);
    };
  }
  next();
};

// Invalidate user cache when user data changes
const invalidateUserCache = (userId) => {
  cache.del(`user:${userId}`);
};

// Invalidate project cache when project data changes
const invalidateProjectCache = (projectId) => {
  cache.del(`project:${projectId}`);
};

// Get cache stats
const getCacheStats = () => {
  return {
    keys: cache.getStats().keys,
    hitRate: cache.getStats().hget,
    size: cache.getStats().ksize + cache.getStats().vsize
  };
};

module.exports = {
  cacheMiddleware,
  cacheUser,
  cacheProject,
  invalidateUserCache,
  invalidateProjectCache,
  getCacheStats
};