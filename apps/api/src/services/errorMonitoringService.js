const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const environmentConfig = require('../config/environment');

class ErrorMonitoringService {
  constructor() {
    this.errorQueue = [];
    this.errorThreshold = parseInt(process.env.ERROR_THRESHOLD) || 10; // Max errors to queue
    this.flushInterval = parseInt(process.env.ERROR_FLUSH_INTERVAL) || 30000; // 30 seconds
    this.isInitialized = false;
    this.isFlushing = false;
    
    // Initialize error reporting based on environment
    this.initialize();
  }

  async initialize() {
    try {
      // Start periodic error flush
      this.startPeriodicFlush();
      this.isInitialized = true;
      
      logger.info('Error monitoring service initialized', {
        environment: process.env.NODE_ENV,
        errorThreshold: this.errorThreshold,
        flushInterval: this.flushInterval
      });
    } catch (error) {
      logger.error('Error initializing error monitoring service', { error: error.message });
      throw error;
    }
  }

  // Start periodic error flush
  startPeriodicFlush() {
    setInterval(async () => {
      if (this.errorQueue.length > 0 && !this.isFlushing) {
        await this.flushErrors();
      }
    }, this.flushInterval);
  }

  // Add error to monitoring queue
  async reportError(error, context = {}) {
    try {
      const errorId = uuidv4();
      const timestamp = new Date().toISOString();
      const environment = process.env.NODE_ENV || 'development';
      const service = process.env.SERVICE_NAME || 'delivault-api';

      // Create structured error object
      const errorObject = {
        id: errorId,
        timestamp,
        environment,
        service,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code || 'UNKNOWN_ERROR',
        },
        context: {
          ...context,
          userAgent: context.userAgent || 'unknown',
          ip: context.ip || 'unknown',
          userId: context.userId || null,
          url: context.url || 'unknown',
          method: context.method || 'unknown'
        },
        severity: this.determineSeverity(error),
        fingerprint: this.generateFingerprint(error, context)
      };

      // Add to queue for batch processing
      this.errorQueue.push(errorObject);

      // Log immediately for high severity errors
      if (errorObject.severity === 'critical') {
        logger.error('CRITICAL ERROR REPORTED', errorObject);
      } else if (errorObject.severity === 'high') {
        logger.error('HIGH SEVERITY ERROR REPORTED', errorObject);
      } else {
        logger.warn('ERROR REPORTED', errorObject);
      }

      // Flush if threshold is reached
      if (this.errorQueue.length >= this.errorThreshold) {
        await this.flushErrors();
      }

      // Also send to external error reporting service if configured
      await this.sendToExternalService(errorObject);
    } catch (reportingError) {
      // If error reporting itself fails, log to ensure we don't lose track
      console.error('Error reporting failed:', reportingError.message);
    }
  }

  // Determine error severity based on error type and context
  determineSeverity(error) {
    // Critical errors that should halt or require immediate attention
    const criticalErrors = [
      'DatabaseConnectionError',
      'AuthenticationError', 
      'PaymentProcessingError',
      'SecurityError',
      'ValidationError'
    ];

    // High severity errors that indicate significant problems
    const highSeverityErrors = [
      'NotFoundError',
      'UnauthorizedError',
      'ForbiddenError',
      'RateLimitError',
      'PaymentError',
      'EmailError'
    ];

    if (criticalErrors.includes(error.name)) {
      return 'critical';
    } else if (highSeverityErrors.includes(error.name)) {
      return 'high';
    } else if (error.status && error.status >= 500) {
      return 'high';
    } else if (error.status && error.status >= 400) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Generate fingerprint for error grouping
  generateFingerprint(error, context) {
    // Create a consistent fingerprint based on error type, message, and context
    const fingerprintParts = [
      error.name || 'UnknownError',
      error.message ? error.message.split(' ')[0] : 'UnknownMessage', // First part of message
      context.url || 'unknown',
      context.method || 'unknown'
    ].filter(Boolean);

    return this.hashString(fingerprintParts.join(':'));
  }

  // Simple hash function for fingerprinting
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Flush queued errors
  async flushErrors() {
    if (this.isFlushing || this.errorQueue.length === 0) {
      return;
    }

    this.isFlushing = true;
    const errorsToFlush = [...this.errorQueue];
    this.errorQueue = [];

    try {
      logger.info(`Flushing ${errorsToFlush.length} errors to monitoring service`, {
        timestamp: new Date().toISOString()
      });

      // Process errors in batches
      const batchSize = 100;
      for (let i = 0; i < errorsToFlush.length; i += batchSize) {
        const batch = errorsToFlush.slice(i, i + batchSize);
        await this.processErrorBatch(batch);
      }

      logger.info('Error flush completed successfully');
    } catch (flushError) {
      logger.error('Error flushing queued errors', { error: flushError.message });
      
      // Add errors back to queue if flush failed
      this.errorQueue = [...errorsToFlush, ...this.errorQueue];
    } finally {
      this.isFlushing = false;
    }
  }

  // Process a batch of errors
  async processErrorBatch(batch) {
    // In production, this would send to external services like Sentry, Rollbar, etc.
    // For now, just log the batch
    logger.info('Processing error batch', {
      batchSize: batch.length,
      timestamp: new Date().toISOString()
    });

    // Log each error in the batch
    for (const error of batch) {
      // Already logged when error was added, so just track statistics
    }

    // Could add external service reporting here
    await this.sendBatchToExternalService(batch);
  }

  // Send error to external monitoring service (placeholder for Sentry, Rollbar, etc.)
  async sendToExternalService(errorObject) {
    // This would integrate with services like Sentry, Rollbar, etc.
    // For now, we'll just return a promise for async compatibility
    return Promise.resolve();
  }

  // Send batch of errors to external service
  async sendBatchToExternalService(batch) {
    // This would integrate with services like Sentry, Rollbar, etc.
    return Promise.resolve();
  }

  // Create error reporting middleware
  errorReportingMiddleware() {
    return (error, req, res, next) => {
      // Report the error with request context
      this.reportError(error, {
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user ? req.user.userId : null,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });

      // Continue with original error handling
      next(error);
    };
  }

  // Performance monitoring
  monitorPerformance(operationName, duration, context = {}) {
    const performanceThreshold = parseInt(process.env.PERFORMANCE_THRESHOLD) || 5000; // 5 seconds
    
    if (duration > performanceThreshold) {
      const performanceError = new Error(`Performance issue detected: ${operationName} took ${duration}ms`);
      performanceError.name = 'PerformanceWarning';
      
      this.reportError(performanceError, {
        ...context,
        operation: operationName,
        duration: duration,
        threshold: performanceThreshold,
        url: context.url,
        method: context.method
      });
    }
  }

  // Measure execution time of a function
  async measureExecutionTime(operationName, fn, context = {}) {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.monitorPerformance(operationName, duration, context);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Report the error that occurred during execution
      this.reportError(error, {
        ...context,
        operation: operationName,
        duration: duration,
        url: context.url,
        method: context.method
      });
      
      throw error;
    }
  }

  // Get error statistics
  getErrorStatistics() {
    const stats = {
      totalErrors: this.errorQueue.length,
      severityBreakdown: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    // Count errors by severity
    for (const error of this.errorQueue) {
      stats.severityBreakdown[error.severity]++;
    }

    return stats;
  }

  // Get error reporting status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isFlushing: this.isFlushing,
      queueLength: this.errorQueue.length,
      errorThreshold: this.errorThreshold,
      flushInterval: this.flushInterval,
      statistics: this.getErrorStatistics()
    };
  }

  // Clear error queue (for testing)
  clearQueue() {
    this.errorQueue = [];
  }

  // Shutdown gracefully
  async shutdown() {
    // Flush any remaining errors
    if (this.errorQueue.length > 0) {
      await this.flushErrors();
    }
    
    logger.info('Error monitoring service shutdown completed');
  }
}

module.exports = new ErrorMonitoringService();