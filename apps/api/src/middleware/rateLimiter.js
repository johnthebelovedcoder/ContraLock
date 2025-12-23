const rateLimit = require('express-rate-limit');
const Redis = require('redis');
const logger = require('../utils/logger');

class RateLimiter {
  constructor() {
    this.redisClient = null;
    this.limiterConfig = {};
    this.redisEnabled = process.env.REDIS_URL ? true : false;

    if (this.redisEnabled) {
      this.redisClient = Redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            // Exponential backoff strategy
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.redisClient.on('error', (error) => {
        logger.error('Redis client error:', { error: error.message });
        // If Redis fails, we'll fall back to memory store
        this.redisEnabled = false;
      });

      this.redisClient.connect().catch(err => {
        logger.error('Redis connection error:', { error: err.message });
        // If Redis fails to connect, we'll fall back to memory store
        this.redisEnabled = false;
      });
    }

    // Initialize all limiters immediately
    this.initializeLimiters().catch(err => {
      logger.error('Failed to initialize rate limiters:', { error: err.message });
    });
  }

  // Initialize different types of rate limiters
  async initializeLimiters() {
    // Rate limiter store configuration
    const store = this.redisEnabled ? {
      redis: this.redisClient,
    } : undefined;

    // Global rate limiter - applies to all requests
    this.globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
      message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      skip: (req) => {
        // Skip rate limiting for certain paths
        return req.path === '/health' ||
               req.path === '/api/health' ||
               req.path.startsWith('/static/') ||
               req.path === '/api/v1/auth/me' ||
               req.path === '/auth/me';
      },
      store: store
    });

    // Auth-specific rate limiter
    this.authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 5 : 20, // Limit for auth attempts
      message: {
        status: 'error',
        message: 'Too many authentication attempts, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise use IP
        return req.user ? req.user.id : req.ip;
      },
      store: store
    });

    // API rate limiter for general API endpoints
    this.apiLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: process.env.NODE_ENV === 'production' ? 100 : 500, // Limit each IP to API requests per windowMs
      message: {
        status: 'error',
        message: 'Too many API requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store
    });

    // Upload-specific rate limiter
    this.uploadLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 5, // Limit file uploads
      message: {
        status: 'error',
        message: 'Too many file uploads, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store
    });

    // Predefined IP limiter with default configuration (can be customized when needed)
    this.ipLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store
    });
  }

  // Get the appropriate rate limiter
  async getLimiter(type = 'global') {
    if (!this.globalLimiter) {
      await this.initializeLimiters();
    }

    switch (type) {
      case 'auth':
        return this.authLimiter;
      case 'api':
        return this.apiLimiter;
      case 'upload':
        return this.uploadLimiter;
      case 'global':
      default:
        return this.globalLimiter;
    }
  }

  // Dynamic rate limiter with custom configuration - return predefined or create at startup
  async createCustomLimiter(config) {
    if (!this.globalLimiter) {
      await this.initializeLimiters();
    }

    // We can't create new rate limiters dynamically due to express-rate-limit constraints
    // Instead, return one of the predefined ones or throw a warning
    logger.warn('Dynamic rate limiter creation is not allowed. Using API limiter as fallback.', { config });
    return this.apiLimiter;
  }

  // Middleware to conditionally apply rate limiting based on route
  getRouteSpecificLimiter(routePath) {
    // Check if path matches auth routes
    if (routePath.startsWith('/auth') || routePath.startsWith('/api/v1/auth')) {
      return this.authLimiter;
    }

    // Check if path matches file upload routes
    if (routePath.includes('/upload') || routePath.includes('/file') || routePath.includes('/avatar')) {
      return this.uploadLimiter;
    }

    // Default to API limiter for API routes
    if (routePath.startsWith('/api')) {
      return this.apiLimiter;
    }

    // Default to global limiter
    return this.globalLimiter;
  }

  // Close Redis connection
  async close() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

// Export a singleton instance
module.exports = new RateLimiter();