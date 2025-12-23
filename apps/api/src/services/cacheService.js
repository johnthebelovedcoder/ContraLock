class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = new Map();
    this.redisAvailable = false;
    
    // Check if Redis should be used (default: true, set USE_REDIS=false to disable)
    this.useRedis = process.env.USE_REDIS !== 'false';
    
    if (this.useRedis) {
      this.initializeRedis();
    } else {
      console.log('Using in-memory cache (Redis is disabled)');
    }
  }

  async initializeRedis() {
    try {
      const { createClient } = require('redis');
      
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 5000,
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              console.log('Max Redis reconnection attempts reached. Using in-memory cache.');
              this.redisAvailable = false;
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 5000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.redisAvailable = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.redisAvailable = true;
      });

      this.client.on('reconnecting', () => {
        console.log('Redis Client Reconnecting...');
      });

      await this.client.connect();
      this.isConnected = true;
      this.redisAvailable = true;
      console.log('Redis cache connected successfully');
    } catch (error) {
      console.error('Failed to connect to Redis, using in-memory cache:', error.message);
      this.redisAvailable = false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('Redis cache disconnected');
    }
  }

  async set(key, value, ttl = 3600) {
    // Always store in memory cache
    this.memoryCache.set(key, {
      value: JSON.parse(JSON.stringify(value)), // Deep clone
      expiresAt: ttl ? Date.now() + (ttl * 1000) : null
    });
    
    // If Redis is available, also store there
    if (this.redisAvailable && this.isConnected) {
      try {
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
        await this.client.set(key, serializedValue, { EX: ttl });
      } catch (error) {
        console.error(`Redis SET error for key ${key}:`, error.message);
      }
    }
  }

  async get(key) {
    // Check memory cache first
    const cached = this.memoryCache.get(key);
    if (cached) {
      if (!cached.expiresAt || cached.expiresAt > Date.now()) {
        return cached.value;
      }
      // Remove expired item
      this.memoryCache.delete(key);
    }
    
    // If Redis is available, try to get from there
    if (this.redisAvailable && this.isConnected) {
      try {
        const value = await this.client.get(key);
        if (value) {
          try {
            const parsedValue = JSON.parse(value);
            // Cache in memory for faster access
            this.memoryCache.set(key, {
              value: parsedValue,
              expiresAt: Date.now() + 60000 // Cache in memory for 1 minute
            });
            return parsedValue;
          } catch (e) {
            return value;
          }
        }
      } catch (error) {
        console.error(`Redis GET error for key ${key}:`, error.message);
      }
    }
    
    return null;
  }

  async delete(key) {
    // Remove from memory cache
    this.memoryCache.delete(key);
    
    // If Redis is available, also delete from there
    if (this.redisAvailable && this.isConnected) {
      try {
        await this.client.del(key);
      } catch (error) {
        console.error(`Redis DEL error for key ${key}:`, error.message);
      }
    }
  }

  async flush() {
    // Clear memory cache
    this.memoryCache.clear();
    
    // If Redis is available, also flush it
    if (this.redisAvailable && this.isConnected) {
      try {
        await this.client.flushAll();
      } catch (error) {
        console.error('Redis FLUSHALL error:', error.message);
      }
    }
  }

  // Specific cache keys for the application
  getProjectCacheKey(projectId) {
    return `project:${projectId}`;
  }

  getUserCacheKey(userId) {
    return `user:${userId}`;
  }

  getMilestoneCacheKey(milestoneId) {
    return `milestone:${milestoneId}`;
  }

  getDisputeCacheKey(disputeId) {
    return `dispute:${disputeId}`;
  }

  getNotificationsCacheKey(userId) {
    return `notifications:user:${userId}`;
  }

  getConversationCacheKey(conversationId) {
    return `conversation:${conversationId}`;
  }

  // Cache commonly accessed data with specific methods
  async cacheProject(projectId, projectData, ttl = 1800) { // 30 minutes default
    const key = this.getProjectCacheKey(projectId);
    await this.set(key, projectData, ttl);
  }

  async getCachedProject(projectId) {
    const key = this.getProjectCacheKey(projectId);
    return await this.get(key);
  }

  async cacheUser(userId, userData, ttl = 3600) { // 1 hour default
    const key = this.getUserCacheKey(userId);
    await this.set(key, userData, ttl);
  }

  async getCachedUser(userId) {
    const key = this.getUserCacheKey(userId);
    return await this.get(key);
  }

  async cacheMilestone(milestoneId, milestoneData, ttl = 1800) { // 30 minutes default
    const key = this.getMilestoneCacheKey(milestoneId);
    await this.set(key, milestoneData, ttl);
  }

  async getCachedMilestone(milestoneId) {
    const key = this.getMilestoneCacheKey(milestoneId);
    return await this.get(key);
  }

  async cacheDispute(disputeId, disputeData, ttl = 1800) { // 30 minutes default
    const key = this.getDisputeCacheKey(disputeId);
    await this.set(key, disputeData, ttl);
  }

  async getCachedDispute(disputeId) {
    const key = this.getDisputeCacheKey(disputeId);
    return await this.get(key);
  }

  async invalidateProjectCache(projectId) {
    const key = this.getProjectCacheKey(projectId);
    await this.del(key);
  }

  async invalidateUserCache(userId) {
    const key = this.getUserCacheKey(userId);
    await this.del(key);
  }

  async invalidateMilestoneCache(milestoneId) {
    const key = this.getMilestoneCacheKey(milestoneId);
    await this.del(key);
  }

  async invalidateDisputeCache(disputeId) {
    const key = this.getDisputeCacheKey(disputeId);
    await this.del(key);
  }

  // Cache project activities
  async cacheProjectActivities(projectId, activities, ttl = 600) { // 10 minutes for activities
    const key = `project:${projectId}:activities`;
    await this.set(key, activities, ttl);
  }

  async getCachedProjectActivities(projectId) {
    const key = `project:${projectId}:activities`;
    return await this.get(key);
  }

  // Cache user notifications
  async cacheUserNotifications(userId, notifications, ttl = 300) { // 5 minutes for notifications
    const key = this.getNotificationsCacheKey(userId);
    await this.set(key, notifications, ttl);
  }

  async getCachedUserNotifications(userId) {
    const key = this.getNotificationsCacheKey(userId);
    return await this.get(key);
  }

  // Invalidate user notifications cache when new notifications arrive
  async invalidateUserNotificationsCache(userId) {
    const key = this.getNotificationsCacheKey(userId);
    await this.del(key);
  }

  // Cache conversation messages
  async cacheConversationMessages(conversationId, messages, ttl = 600) { // 10 minutes for messages
    const key = this.getConversationCacheKey(conversationId);
    await this.set(key, messages, ttl);
  }

  async getCachedConversationMessages(conversationId) {
    const key = this.getConversationCacheKey(conversationId);
    return await this.get(key);
  }

  // Invalidate conversation cache when new messages arrive
  async invalidateConversationCache(conversationId) {
    const key = this.getConversationCacheKey(conversationId);
    await this.del(key);
  }

  // Health check for the cache
  async healthCheck() {
    const memoryStatus = {
      status: 'online',
      message: 'In-memory cache is active',
      items: this.memoryCache.size,
      type: 'memory'
    };

    if (!this.redisAvailable || !this.isConnected) {
      return {
        ...memoryStatus,
        redis: {
          status: 'offline',
          message: 'Redis is not available, using in-memory cache only'
        }
      };
    }

    try {
      await this.client.ping();
      return {
        ...memoryStatus,
        redis: {
          status: 'online',
          message: 'Redis cache is online and responsive'
        }
      };
    } catch (error) {
      return {
        ...memoryStatus,
        redis: {
          status: 'degraded',
          message: `Redis cache error: ${error.message}`
        }
      };
    }
  }
}

module.exports = new CacheService();