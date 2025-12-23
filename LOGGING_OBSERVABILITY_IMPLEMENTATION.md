# Comprehensive Logging and Observability System Implementation

## Overview
This document outlines the implementation of a comprehensive logging and observability system for the ContraLock platform. The system will include enhanced logging with correlation IDs, error tracking with Sentry, performance monitoring, and structured observability metrics.

## Why Enhanced Logging & Observability?

### Critical Requirements:
- **Traceability**: Correlation IDs to track requests across services
- **Error Detection**: Proactive error monitoring and alerting
- **Performance Monitoring**: Response times, throughput, and resource usage
- **Business Insights**: User behavior, feature adoption, and revenue metrics
- **Security**: Audit trails and suspicious activity detection
- **Debugging**: Structured logs for efficient troubleshooting
- **Compliance**: GDPR and financial transaction logging requirements

## Technical Implementation

### 1. Enhanced Logging System with Winston

**Installation**:
```bash
cd apps/api
npm install winston winston-daily-rotate-file express-winston
npm install @sentry/node @sentry/tracing  # For error tracking
```

**Enhanced Logger Configuration** (apps/api/src/utils/logger.js):
```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
require('winston-daily-rotate-file');

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'contralock-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level} [${info.service}] ${info.message}`
        )
      ),
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
    }),
    
    // Daily rotating file transport for production
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    
    // Error file transport
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    })
  ]
});

// Add correlation ID context to logs
logger.addContext = (req) => {
  const correlationId = req.headers['x-correlation-id'] || req.id || generateCorrelationId();
  return {
    correlationId,
    userId: req.user?.id || null,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.url
  };
};

// Generate correlation ID
function generateCorrelationId() {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = logger;
```

### 2. Correlation ID Middleware

**Correlation ID Middleware** (apps/api/src/middleware/correlation.js):
```javascript
const uuid = require('uuid').v4;

const correlationIdMiddleware = (req, res, next) => {
  // Generate or use existing correlation ID
  const correlationId = req.headers['x-correlation-id'] || uuid();
  
  // Add to request object
  req.correlationId = correlationId;
  
  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Add to local variables for logging
  res.locals.correlationId = correlationId;
  
  next();
};

module.exports = correlationIdMiddleware;
```

### 3. Enhanced Logging Middleware

**Enhanced Logging Middleware** (apps/api/src/middleware/logging.js):
```javascript
const expressWinston = require('express-winston');
const logger = require('../utils/logger');

// Request logging middleware
const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  expressFormat: false,
  colorize: false,
  dynamicMeta: (req, res) => {
    return {
      correlationId: req.correlationId,
      userId: req.user?.id || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length'),
      responseTime: res.responseTime
    };
  },
  skip: (req, res) => {
    // Skip logging for health checks and static assets
    return req.url.startsWith('/api/health') || req.url.startsWith('/static');
  }
});

// Error logging middleware
const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
  dynamicMeta: (req, res, err) => {
    return {
      correlationId: req.correlationId,
      userId: req.user?.id || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url,
      error: err.message,
      stack: err.stack
    };
  }
});

module.exports = { requestLogger, errorLogger };
```

### 4. Sentry Integration for Error Tracking

**Sentry Configuration** (apps/api/src/config/sentry.js):
```javascript
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || 'development',
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Profiling
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.5, // Capture 50% of transactions for performance monitoring
    // Set sampling rate for profiles
    profilesSampleRate: 0.5,
  });
};

module.exports = { initSentry, Sentry };
```

**Sentry Error Handler Middleware** (apps/api/src/middleware/sentry.js):
```javascript
const { Sentry } = require('../config/sentry');
const logger = require('../utils/logger');

// Sentry error handler middleware
const sentryErrorHandler = (err, req, res, next) => {
  // Capture the error in Sentry
  const eventId = Sentry.captureException(err, {
    extra: {
      url: req.url,
      method: req.method,
      userId: req.user?.id,
      correlationId: req.correlationId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    } : undefined
  });

  logger.error('Error captured by Sentry', {
    error: err.message,
    eventId,
    correlationId: req.correlationId,
    userId: req.user?.id
  });

  // Continue with the default error handling
  next(err);
};

// Sentry request handler (should be first middleware)
const sentryRequestHandler = Sentry.Handlers.requestHandler({
  // Request properties that are safe to include in Sentry events
  request: ['url', 'method', 'query_string', 'body', 'headers'],
  // User properties that are safe to include
  user: ['id', 'email', 'role']
});

// Sentry tracing handler
const sentryTracingHandler = Sentry.Handlers.tracingHandler();

module.exports = {
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler
};
```

### 5. Performance Monitoring Service

**Performance Monitoring Service** (apps/api/src/services/performanceMonitoring.js):
```javascript
const logger = require('../utils/logger');

class PerformanceMonitoring {
  constructor() {
    this.metrics = new Map();
    this.performanceThresholds = {
      api_response_time: 2000, // 2 seconds
      db_query_time: 500,      // 500ms
      email_send_time: 10000,  // 10 seconds
      webhook_process_time: 5000 // 5 seconds
    };
  }

  // Track API endpoint performance
  trackApiPerformance(endpoint, method, responseTime) {
    const metricKey = `${method}:${endpoint}`;
    
    if (responseTime > this.performanceThresholds.api_response_time) {
      logger.warn('API endpoint performance degradation detected', {
        endpoint,
        method,
        responseTime,
        threshold: this.performanceThresholds.api_response_time
      });
    }
    
    // Store in metrics for monitoring
    if (!this.metrics.has(metricKey)) {
      this.metrics.set(metricKey, []);
    }
    
    const endpointMetrics = this.metrics.get(metricKey);
    endpointMetrics.push({
      timestamp: new Date(),
      responseTime,
      method,
      endpoint
    });
    
    // Keep only last 1000 metrics per endpoint
    if (endpointMetrics.length > 1000) {
      endpointMetrics.shift();
    }
  }

  // Track database query performance
  trackDbQuery(query, executionTime) {
    if (executionTime > this.performanceThresholds.db_query_time) {
      logger.warn('Slow database query detected', {
        query,
        executionTime,
        threshold: this.performanceThresholds.db_query_time
      });
    }
  }

  // Track overall system health
  getSystemHealth() {
    const stats = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      metrics: {}
    };

    // Calculate averages for each endpoint
    for (const [key, metrics] of this.metrics) {
      if (metrics.length > 0) {
        const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0);
        const avgResponseTime = totalResponseTime / metrics.length;
        const recentMetrics = metrics.slice(-10); // Last 10 calls
        const recentAvg = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
        
        stats.metrics[key] = {
          totalCalls: metrics.length,
          averageResponseTime: avgResponseTime,
          recentAverage: recentAvg,
          sampleSize: metrics.length
        };
      }
    }

    return stats;
  }

  // Monitor specific business metrics
  trackBusinessMetric(name, value, tags = {}) {
    logger.info('Business metric tracked', {
      metric: name,
      value,
      tags,
      timestamp: new Date()
    });
  }

  // Monitor payment processing performance
  trackPaymentProcessing(timeToProcess, paymentId, success = true) {
    logger.info('Payment processing completed', {
      paymentId,
      timeToProcess,
      success,
      timestamp: new Date()
    });

    if (!success && timeToProcess > 5000) {
      logger.error('Slow or failed payment processing detected', {
        paymentId,
        timeToProcess,
        success
      });
    }
  }

  // Monitor queue processing
  trackQueuePerformance(queueName, jobProcessingTime, success = true) {
    logger.info('Queue job processed', {
      queue: queueName,
      processingTime: jobProcessingTime,
      success,
      timestamp: new Date()
    });

    if (!success && jobProcessingTime > 10000) { // 10 seconds
      logger.warn('Slow queue processing detected', {
        queue: queueName,
        processingTime: jobProcessingTime
      });
    }
  }
}

// Singleton instance
const performanceMonitoring = new PerformanceMonitoring();

module.exports = performanceMonitoring;
```

### 6. Business Metrics Service

**Business Metrics Service** (apps/api/src/services/metricsService.js):
```javascript
const logger = require('../utils/logger');

class MetricsService {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
  }

  // Track user registration
  trackUserRegistration(userId, role, source = 'direct') {
    this.incrementCounter('user_registrations', { role, source });
    logger.info('User registered', { userId, role, source, timestamp: new Date() });
  }

  // Track project creation
  trackProjectCreated(projectId, clientId, budget, category) {
    this.incrementCounter('projects_created', { category });
    this.updateHistogram('project_budgets', budget);
    logger.info('Project created', { projectId, clientId, budget, category, timestamp: new Date() });
  }

  // Track milestone completion
  trackMilestoneCompleted(milestoneId, projectId, freelancerId, completionTime) {
    this.incrementCounter('milestones_completed');
    this.updateHistogram('milestone_completion_time', completionTime);
    logger.info('Milestone completed', { 
      milestoneId, 
      projectId, 
      freelancerId, 
      completionTime, 
      timestamp: new Date() 
    });
  }

  // Track payment processed
  trackPaymentProcessed(paymentId, amount, type, userId) {
    this.incrementCounter('payments_processed', { type });
    this.updateHistogram('payment_amounts', amount);
    logger.info('Payment processed', { paymentId, amount, type, userId, timestamp: new Date() });
  }

  // Track dispute created
  trackDisputeCreated(disputeId, projectId, reason) {
    this.incrementCounter('disputes_created', { reason });
    logger.info('Dispute created', { disputeId, projectId, reason, timestamp: new Date() });
  }

  // Track successful/failed logins
  trackLogin(userId, success = true, source = 'unknown') {
    if (success) {
      this.incrementCounter('successful_logins', { source });
    } else {
      this.incrementCounter('failed_logins', { source });
    }
    logger.info(`User ${success ? 'successful' : 'failed'} login`, { userId, source, success, timestamp: new Date() });
  }

  // Increment a counter metric
  incrementCounter(name, tags = {}) {
    const key = `${name}_${JSON.stringify(tags)}`;
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
  }

  // Update a histogram metric
  updateHistogram(name, value) {
    const current = this.histograms.get(name) || [];
    current.push(value);
    if (current.length > 1000) { // Keep last 1000 values
      current.shift();
    }
    this.histograms.set(name, current);
  }

  // Set a gauge value
  setGauge(name, value, tags = {}) {
    const key = `${name}_${JSON.stringify(tags)}`;
    this.gauges.set(key, value);
  }

  // Get metrics report
  getMetricsReport() {
    const report = {
      counters: {},
      histograms: {},
      gauges: {},
      timestamp: new Date()
    };

    // Process counters
    for (const [key, value] of this.counters) {
      report.counters[key] = value;
    }

    // Process histograms
    for (const [name, values] of this.histograms) {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        report.histograms[name] = {
          count: values.length,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)]
        };
      }
    }

    // Process gauges
    for (const [key, value] of this.gauges) {
      report.gauges[key] = value;
    }

    return report;
  }

  // Track system performance metrics
  trackSystemMetrics() {
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();

    this.setGauge('memory_rss', memory.rss);
    this.setGauge('memory_heap_total', memory.heapTotal);
    this.setGauge('memory_heap_used', memory.heapUsed);
    this.setGauge('memory_external', memory.external);
    
    logger.debug('System metrics updated', {
      memory,
      cpu,
      uptime: process.uptime(),
      timestamp: new Date()
    });
  }
}

// Singleton instance
const metricsService = new MetricsService();

module.exports = metricsService;
```

### 7. Health Check and Monitoring Endpoints

**Health Check Controller** (apps/api/src/controllers/healthController.js):
```javascript
const logger = require('../utils/logger');
const performanceMonitoring = require('../services/performanceMonitoring');

const healthController = {
  // Basic health check
  async healthCheck(req, res) {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: new Date().toISOString(),
      service: 'ContraLock API',
      version: process.env.npm_package_version || 'development'
    };

    try {
      // Add additional health checks here
      healthCheck.status = 'healthy';
      res.status(200).json(healthCheck);
    } catch (error) {
      healthCheck.status = 'unhealthy';
      healthCheck.error = error.message;
      res.status(503).json(healthCheck);
    }
  },

  // Detailed health check with system metrics
  async detailedHealthCheck(req, res) {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };

    try {
      // Check database connectivity
      healthStatus.checks.database = await checkDatabaseHealth();
      if (!healthStatus.checks.database.healthy) {
        healthStatus.status = 'unhealthy';
      }

      // Check Redis connectivity (for queues)
      healthStatus.checks.redis = await checkRedisHealth();
      if (!healthStatus.checks.redis.healthy) {
        healthStatus.status = 'unhealthy';
      }

      // Check external services
      healthStatus.checks.stripe = await checkStripeHealth();
      healthStatus.checks.email = await checkEmailHealth();

      // Add performance metrics
      healthStatus.performance = performanceMonitoring.getSystemHealth();

      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Get application metrics
  async getMetrics(req, res) {
    try {
      const metricsService = require('../services/metricsService');
      const metrics = metricsService.getMetricsReport();
      
      res.json(metrics);
    } catch (error) {
      logger.error('Metrics retrieval failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },

  // Get performance metrics
  async getPerformanceMetrics(req, res) {
    try {
      const systemHealth = performanceMonitoring.getSystemHealth();
      
      res.json(systemHealth);
    } catch (error) {
      logger.error('Performance metrics retrieval failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
};

// Helper functions for health checks
async function checkDatabaseHealth() {
  try {
    const { sequelize } = require('../config/database');
    await sequelize.authenticate();
    return { healthy: true, message: 'Database connectivity OK' };
  } catch (error) {
    return { healthy: false, message: `Database error: ${error.message}` };
  }
}

async function checkRedisHealth() {
  try {
    const redis = require('../config/redis');
    await redis.ping();
    return { healthy: true, message: 'Redis connectivity OK' };
  } catch (error) {
    return { healthy: false, message: `Redis error: ${error.message}` };
  }
}

async function checkStripeHealth() {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // Test by retrieving a simple API call
    await stripe.balance.retrieve();
    return { healthy: true, message: 'Stripe connectivity OK' };
  } catch (error) {
    return { healthy: false, message: `Stripe error: ${error.message}` };
  }
}

async function checkEmailHealth() {
  try {
    // Check if email settings are properly configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return { healthy: false, message: 'Email configuration incomplete' };
    }
    
    return { healthy: true, message: 'Email configuration OK' };
  } catch (error) {
    return { healthy: false, message: `Email error: ${error.message}` };
  }
}

module.exports = healthController;
```

### 8. Updated App Configuration with Monitoring

**Updated App Setup** (apps/api/src/app.js) - with monitoring integration:
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');

// Monitoring and logging imports
const { initSentry, Sentry } = require('./config/sentry');
const { sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } = require('./middleware/sentry');
const { requestLogger, errorLogger } = require('./middleware/logging');
const correlationIdMiddleware = require('./middleware/correlation');

// Import services
const performanceMonitoring = require('./services/performanceMonitoring');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const webhookRoutes = require('./routes/webhook');
const healthRoutes = require('./routes/health'); // Add health routes

const app = express();

// Initialize Sentry if configured
if (process.env.SENTRY_DSN) {
  initSentry();
  app.use(sentryRequestHandler);
  app.use(sentryTracingHandler);
}

// Correlation ID middleware (should be early in the stack)
app.use(correlationIdMiddleware);

// Logging middleware
app.use(requestLogger);

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Performance monitoring for all requests
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Capture response time when response is finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Track API performance
    performanceMonitoring.trackApiPerformance(req.originalUrl, req.method, responseTime);
  });
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// IMPORTANT: Raw body parser for Stripe webhooks (before JSON parser)
app.use('/webhook', express.raw({ type: 'application/json' }));

// Data sanitization
app.use(mongoSanitize());

// Compression
app.use(compression());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api', healthRoutes); // Add health routes

// Error logging middleware (after routes, before error handler)
app.use(errorLogger);

// Sentry error handler
app.use(sentryErrorHandler);

// Generic error handler
app.use((err, req, res, next) => {
  // Log the error
  console.error('Unhandled error:', err);
  
  // Send response
  res.status(500).json({ 
    error: 'Internal server error',
    correlationId: req.correlationId
  });
});

module.exports = app;
```

**Health Routes** (apps/api/src/routes/health.js):
```javascript
const express = require('express');
const healthController = require('../controllers/healthController');
const router = express.Router();

// Public health check endpoints (no authentication required)
router.get('/health', healthController.healthCheck);
router.get('/health/detailed', healthController.detailedHealthCheck);
router.get('/metrics', healthController.getMetrics);
router.get('/performance', healthController.getPerformanceMetrics);

module.exports = router;
```

### 9. Application Performance Monitoring (APM) Integration

**APM Service** (apps/api/src/services/apmService.js):
```javascript
const Sentry = require('@sentry/node');

class APMService {
  static startTransaction(name, op = 'default') {
    if (process.env.SENTRY_DSN) {
      return Sentry.startTransaction({
        name,
        op
      });
    }
    return null;
  }

  static finishTransaction(transaction, status = 'ok') {
    if (transaction) {
      transaction.setStatus(status);
      transaction.finish();
    }
  }

  static captureException(error, context = {}) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        extra: context
      });
    }
  }

  static setTransactionContext(transaction, key, value) {
    if (transaction) {
      transaction.setContext(key, value);
    }
  }

  static addBreadcrumb(breadcrumb) {
    if (process.env.SENTRY_DSN) {
      Sentry.addBreadcrumb(breadcrumb);
    }
  }

  // Performance monitoring for specific operations
  static async monitorOperation(operationName, operationFn, context = {}) {
    const transaction = this.startTransaction(operationName);
    
    try {
      this.setTransactionContext(transaction, 'operation', context);
      
      const result = await operationFn();
      
      this.finishTransaction(transaction, 'ok');
      return result;
    } catch (error) {
      this.captureException(error, { ...context, operation: operationName });
      this.finishTransaction(transaction, 'internal_error');
      throw error;
    }
  }

  // Monitor database queries
  static async monitorDbQuery(query, queryFn) {
    const transaction = this.startTransaction(`DB Query: ${query}`, 'db.query');
    
    try {
      const startTime = Date.now();
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      this.addBreadcrumb({
        category: 'query',
        message: query,
        data: { duration },
        level: 'info'
      });
      
      this.finishTransaction(transaction, 'ok');
      return result;
    } catch (error) {
      this.captureException(error, { query });
      this.finishTransaction(transaction, 'internal_error');
      throw error;
    }
  }

  // Monitor external API calls
  static async monitorExternalCall(service, endpoint, callFn) {
    const transaction = this.startTransaction(`External API: ${service} - ${endpoint}`, 'http.client');
    
    try {
      const result = await callFn();
      this.finishTransaction(transaction, 'ok');
      return result;
    } catch (error) {
      this.captureException(error, { service, endpoint });
      this.finishTransaction(transaction, 'internal_error');
      throw error;
    }
  }
}

module.exports = APMService;
```

### 10. Environment Configuration

**Updated Environment Variables** (apps/api/.env):
```env
# Logging Configuration
LOG_LEVEL=info
LOG_PRETTY_PRINT=false
LOG_TO_FILE=true
LOG_RETENTION_DAYS=30

# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true
API_RESPONSE_TIME_THRESHOLD=2000
DATABASE_QUERY_TIME_THRESHOLD=500

# Health Check Configuration
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_RETRIES=3
```

### 11. Testing

**Logging Tests** (apps/api/tests/unit/logging.test.js):
```javascript
const logger = require('../../src/utils/logger');
const { requestLogger, errorLogger } = require('../../src/middleware/logging');

describe('Logging System', () => {
  test('logger should create structured logs', () => {
    // Test that logger creates proper structured logs
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    logger.info('Test log message', { test: 'data', number: 123 });
    
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  test('correlation ID should be added to logs', () => {
    const req = {
      headers: { 'x-correlation-id': 'test-correlation-123' },
      user: { id: 'user-123' },
      ip: '127.0.0.1',
      get: () => 'test-agent'
    };
    
    const context = logger.addContext(req);
    
    expect(context.correlationId).toBe('test-correlation-123');
    expect(context.userId).toBe('user-123');
  });

  test('error logger should capture errors with context', () => {
    const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const err = new Error('Test error');
    const req = {
      headers: { 'x-correlation-id': 'test-123' },
      ip: '127.0.0.1',
      get: () => 'test-agent',
      method: 'GET',
      url: '/test'
    };
    
    // Simulate error logging
    logger.error('Error occurred', { error: err.message, correlationId: req.headers['x-correlation-id'] });
    
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});

describe('Performance Monitoring', () => {
  const performanceMonitoring = require('../../src/services/performanceMonitoring');

  test('should track API performance', () => {
    performanceMonitoring.trackApiPerformance('/api/test', 'GET', 500);
    
    const health = performanceMonitoring.getSystemHealth();
    expect(health.metrics['GET:/api/test']).toBeDefined();
  });

  test('should detect performance issues', () => {
    // This should trigger a warning
    console.warn = jest.fn(); // Mock console.warn
    performanceMonitoring.trackApiPerformance('/api/slow', 'GET', 5000); // Exceeds threshold
    
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('performance degradation')
    );
  });
});

describe('Metrics Service', () => {
  const metricsService = require('../../src/services/metricsService');

  test('should track user registration', () => {
    metricsService.trackUserRegistration('user-123', 'client', 'web');
    
    const report = metricsService.getMetricsReport();
    expect(report.counters['user_registrations_{"role":"client","source":"web"}']).toBe(1);
  });

  test('should track payment metrics', () => {
    metricsService.trackPaymentProcessed('payment-123', 100, 'deposit', 'user-123');
    
    const report = metricsService.getMetricsReport();
    expect(report.counters['payments_processed_{"type":"deposit"}']).toBe(1);
    expect(report.histograms.payment_amounts).toBeDefined();
  });

  test('should calculate histogram percentiles', () => {
    // Add some test data
    for (let i = 1; i <= 100; i++) {
      metricsService.updateHistogram('test_metric', i);
    }
    
    const report = metricsService.getMetricsReport();
    const histogram = report.histograms.test_metric;
    
    expect(histogram).toBeDefined();
    expect(histogram.count).toBe(100);
    expect(histogram.p50).toBeGreaterThanOrEqual(45);
    expect(histogram.p95).toBeGreaterThanOrEqual(90);
  });
});
```

### 12. Monitoring Dashboard Configuration

**Prometheus Metrics Endpoint** (apps/api/src/routes/metrics.js):
```javascript
const express = require('express');
const client = require('prom-client');
const router = express.Router();

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({
  register,
  prefix: 'contralock_'
});

// Create custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  registers: [register]
});

// Middleware to record metrics
router.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  
  res.on('finish', () => {
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    }, end());
    
    httpRequestTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
  });
  
  next();
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

module.exports = router;
```

### 13. Implementation Plan

**Phase 1: Logging Enhancement (Days 1-2)**
1. Install and configure Winston with DailyRotateFile
2. Implement correlation ID middleware
3. Add enhanced logging middleware
4. Update existing controllers to use structured logging
5. Test logging functionality

**Phase 2: Error Tracking (Days 2-3)**
1. Install and configure Sentry
2. Implement Sentry request and error handlers
3. Add error context to Sentry events
4. Test error tracking with simulated errors
5. Set up Sentry alerting

**Phase 3: Performance Monitoring (Days 3-4)**
1. Implement performance monitoring service
2. Add metrics collection for key operations
3. Create health check endpoints
4. Implement business metrics tracking
5. Add performance alerting

**Phase 4: Production Deployment (Days 4-5)**
1. Deploy monitoring to staging
2. Test in production-like environment
3. Set up monitoring dashboards
4. Configure alerting and notifications
5. Document monitoring procedures

This comprehensive logging and observability system will provide:

1. Structured, searchable logs with correlation IDs
2. Proactive error detection and tracking with Sentry
3. Performance monitoring and alerting
4. Business metrics tracking
5. Health check endpoints
6. Integration with monitoring platforms like Prometheus
7. Proper error handling and context capture
8. GDPR-compliant logging practices