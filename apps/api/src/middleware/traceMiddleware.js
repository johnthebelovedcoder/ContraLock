// Middleware for adding trace IDs to requests for distributed tracing
const { v4: uuidv4 } = require('uuid');
const { logger } = require('./logging');

// Middleware to add trace ID to requests
const traceIdMiddleware = (req, res, next) => {
  // Get trace ID from header or generate new one
  const traceId = req.headers['x-trace-id'] || uuidv4();
  
  // Attach trace ID to request object
  req.traceId = traceId;
  
  // Add trace ID to response headers
  res.setHeader('X-Trace-ID', traceId);
  
  // Add trace ID to logger context for this request
  req.loggerContext = { traceId };
  
  // Override the logger methods to include trace ID
  req.logger = {
    info: (message, meta = {}) => logger.info(message, { ...meta, ...req.loggerContext }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, ...req.loggerContext }),
    error: (message, meta = {}) => logger.error(message, { ...meta, ...req.loggerContext }),
    debug: (message, meta = {}) => logger.debug(message, { ...meta, ...req.loggerContext })
  };
  
  next();
};

// Enhanced logger that includes trace ID when available
class TraceLogger {
  constructor(baseLogger) {
    this.baseLogger = baseLogger;
  }
  
  info(message, meta = {}) {
    this.baseLogger.info(message, meta);
  }
  
  warn(message, meta = {}) {
    this.baseLogger.warn(message, meta);
  }
  
  error(message, meta = {}) {
    this.baseLogger.error(message, meta);
  }
  
  debug(message, meta = {}) {
    this.baseLogger.debug(message, meta);
  }
  
  // Create a child logger with additional context
  child(context) {
    const loggerContext = this;
    return {
      info: (message, meta = {}) => loggerContext.baseLogger.info(message, { ...context, ...meta }),
      warn: (message, meta = {}) => loggerContext.baseLogger.warn(message, { ...context, ...meta }),
      error: (message, meta = {}) => loggerContext.baseLogger.error(message, { ...context, ...meta }),
      debug: (message, meta = {}) => loggerContext.baseLogger.debug(message, { ...context, ...meta })
    };
  }
}

module.exports = {
  traceIdMiddleware,
  TraceLogger
};