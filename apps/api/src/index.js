const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { xssClean } = require('./middleware/security');
const { requestLogger } = require('./middleware/logging');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const { traceIdMiddleware } = require('./middleware/traceMiddleware');
const apiVersioningService = require('./middleware/apiVersioning');

// Load and initialize environment configuration
const environmentConfig = require('./config/environment');
const connectDB = require('./config/db');
const { logger } = require('./middleware/logging');

// Initialize configuration before other imports
environmentConfig.initialize()
  .then(() => {
    logger.info('Environment configuration loaded successfully');
  })
  .catch(err => {
    console.error('Failed to initialize environment configuration:', err);
    process.exit(1);
  });

const app = express();
const server = http.createServer(app);

// Get port from centralized configuration
let PORT;
try {
  PORT = environmentConfig.get('PORT');
} catch (configError) {
  console.error('Configuration not initialized, using default port:', configError.message);
  PORT = 3001;
}

// Connect to database
connectDB();

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.stripe.com"], // For Stripe
    },
  },
}));
const { getAdvancedCorsConfig } = require('./middleware/corsConfig');

app.use(cors(getAdvancedCorsConfig()));

// Initialize rate limiters at startup (not during requests)
let globalLimiter, authLimiter;

// Initialize limiters after rateLimiter is ready
rateLimiter.getLimiter('global').then(limiter => {
  globalLimiter = limiter;
}).catch(err => {
  console.error('Failed to initialize global rate limiter:', err);
});

rateLimiter.getLimiter('auth').then(limiter => {
  authLimiter = limiter;
}).catch(err => {
  console.error('Failed to initialize auth rate limiter:', err);
});

// Apply centralized rate limiting via middleware
app.use((req, res, next) => {
  if (globalLimiter) {
    globalLimiter(req, res, next);
  } else {
    // Fallback if limiter is not ready yet
    next();
  }
});

// Custom middleware to handle auth routes with specific rate limiting
app.use('/auth', (req, res, next) => {
  if (req.path === '/me' || req.path === '/me/') {
    return next(); // Skip rate limiting for /auth/me
  }
  if (authLimiter) {
    return authLimiter(req, res, next);
  } else {
    // Fallback if limiter is not ready yet
    return next();
  }
});

// Apply auth limiter to versioned auth routes
app.use('/api/v1/auth', (req, res, next) => {
  if (req.path === '/me' || req.path === '/me/') {
    return next(); // Skip rate limiting for /api/v1/auth/me
  }
  if (authLimiter) {
    return authLimiter(req, res, next);
  } else {
    // Fallback if limiter is not ready yet
    return next();
  }
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xssClean);

// Trace ID middleware for distributed tracing
app.use(traceIdMiddleware);

// Logging middleware
app.use(requestLogger);

// Body parsing middleware with enhanced security
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    // Add custom validation here if needed
  }
}));
app.use(express.urlencoded({ extended: true }));

// Define authLimiter properly for route usage - check if the rate limiter is ready
const authLimiterMiddleware = (req, res, next) => {
  if (req.path === '/me' || req.path === '/me/' || req.path === '/refresh' || req.path === '/logout') {
    return next(); // Skip rate limiting for auth endpoints that shouldn't be limited
  }
  if (authLimiter) {
    return authLimiter(req, res, next);
  } else {
    // Fallback if limiter is not ready yet
    return next();
  }
};

// API routes with versioning - matching frontend expectations
app.use('/api/v1/auth', authLimiterMiddleware, require('./routes/auth'));  // Apply authLimiter to auth routes
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/milestones', require('./routes/milestones'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/wallet', require('./routes/wallet'));
app.use('/api/v1/disputes', require('./routes/disputes'));
app.use('/api/v1/files', require('./routes/files'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/messaging', require('./routes/messaging'));
app.use('/api/v1/analytics', require('./routes/analytics'));
app.use('/api/v1/2fa', require('./routes/twoFactorAuth'));
app.use('/api/v1/social', require('./routes/socialAuth'));
app.use('/api/v1/admin', require('./routes/admin'));

// Legacy routes (for backward compatibility during transition period)
// This allows existing frontend to continue working with versioned routes
app.use('/auth', authLimiterMiddleware, require('./routes/auth'));  // Apply authLimiter to legacy auth routes
app.use('/users', require('./routes/users'));
app.use('/projects', require('./routes/projects'));
app.use('/milestones', require('./routes/milestones'));
app.use('/payments', require('./routes/payments'));
app.use('/wallet', require('./routes/wallet'));
app.use('/disputes', require('./routes/disputes'));
app.use('/files', require('./routes/files'));
app.use('/notifications', require('./routes/notifications'));
app.use('/messaging', require('./routes/messaging'));
app.use('/admin', require('./routes/admin'));

// API versioning middleware (should be placed after traceIdMiddleware but before route handlers)
app.use('/api', apiVersioningService.versionMiddleware());

// API status information and versioning endpoints
app.use('/api/status', require('./routes/apiStatus'));

// API version information (new enhanced version)
app.get('/api', (req, res) => {
  const status = apiVersioningService.getApiStatus();
  res.json({
    version: req.apiVersion || 'v2',
    status: 'active',
    timestamp: new Date().toISOString(),
    ...status,
    endpoints: {
      current: '/api/v2',
      v1: '/api/v1',  // Keep for backward compatibility
      v2: '/api/v2',
      v3: '/api/v3',  // Beta version
      status: '/api/status'
    }
  });
});

// API version information by version (backward compatibility)
app.get('/api/v1', (req, res) => {
  res.json({
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      projects: '/api/v1/projects',
      milestones: '/api/v1/milestones',
      payments: '/api/v1/payments',
      disputes: '/api/v1/disputes',
      files: '/api/v1/files',
      notifications: '/api/v1/notifications'
    }
  });
});

// Add v2 and v3 endpoints with enhanced versioning
app.get('/api/v2', (req, res) => {
  res.json({
    version: '2.0.0',
    status: 'current',
    timestamp: new Date().toISOString(),
    features: apiVersioningService.getFeaturesByVersion('v2'),
    endpoints: {
      auth: '/api/v2/auth',
      users: '/api/v2/users',
      projects: '/api/v2/projects',
      milestones: '/api/v2/milestones',
      payments: '/api/v2/payments',
      disputes: '/api/v2/disputes',
      files: '/api/v2/files',
      notifications: '/api/v2/notifications',
      analytics: '/api/v2/analytics'
    }
  });
});

app.get('/api/v3', (req, res) => {
  res.json({
    version: '3.0.0',
    status: 'beta',
    timestamp: new Date().toISOString(),
    features: apiVersioningService.getFeaturesByVersion('v3'),
    endpoints: {
      auth: '/api/v3/auth',
      users: '/api/v3/users',
      projects: '/api/v3/projects',
      milestones: '/api/v3/milestones',
      payments: '/api/v3/payments',
      disputes: '/api/v3/disputes',
      files: '/api/v3/files',
      notifications: '/api/v3/notifications',
      analytics: '/api/v3/analytics',
      ai: '/api/v3/ai'
    }
  });
});

// Monitoring and health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// System stats endpoint (for monitoring)
app.get('/stats', (req, res) => {
  const stats = {
    status: 'active',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage ? process.cpuUsage() : 'not available on this platform',
    nodeVersion: process.version,
    pid: process.pid,
    platform: process.platform,
    // Include cache stats if using caching
    cache: require('./middleware/cache').getCacheStats ? require('./middleware/cache').getCacheStats() : null
  };

  res.json(stats);
});

// Error handling middleware
app.use(globalErrorHandler);

// 404 handler
app.use(notFoundHandler);

// Initialize Socket.IO
const { initializeSocket } = require('./socket/server');
initializeSocket(server);

// Cache service is now auto-initialized when required
const cacheService = require('./services/cacheService');


// Initialize automated milestone acceptance service
const AutoMilestoneAcceptanceService = require('./services/autoMilestoneAcceptanceService');
const autoMilestoneService = new AutoMilestoneAcceptanceService();
autoMilestoneService.start();

// Initialize scheduled tasks service
const schedulerService = require('./services/schedulerService');
schedulerService.initialize()
  .then(() => {
    logger.info('Scheduler service initialized successfully');
  })
  .catch(err => {
    logger.error('Failed to initialize scheduler service:', err);
  });

// Initialize database indexing service
const databaseIndexingService = require('./services/databaseIndexingService');
databaseIndexingService.createIndexes()
  .then(() => {
    logger.info('Database indexing completed successfully');
  })
  .catch(err => {
    logger.error('Failed to create database indexes:', err);
  });

// Initialize error monitoring service
const errorMonitoringService = require('./services/errorMonitoringService');
// Error monitoring service is initialized automatically in the constructor
logger.info('Error monitoring service initialized');


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  autoMilestoneService.stop();
  schedulerService.stop()
    .catch(err => logger.error('Error stopping scheduler service:', err));
  // Flush any remaining errors before shutting down
  errorMonitoringService.shutdown()
    .catch(err => logger.error('Error during error monitoring shutdown:', err));
  cacheService.disconnect();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  autoMilestoneService.stop();
  schedulerService.stop()
    .catch(err => logger.error('Error stopping scheduler service:', err));
  // Flush any remaining errors before shutting down
  errorMonitoringService.shutdown()
    .catch(err => logger.error('Error during error monitoring shutdown:', err));
  cacheService.disconnect();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;