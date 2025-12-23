const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json() // Output as JSON
  ),
  defaultMeta: { service: 'contralock-api' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'logs/combined.log' }),
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest })`
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// HTTP request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  // Capture the original URL to ensure consistency between start and finish logs
  const originalUrl = req.originalUrl || req.url;
  // Get trace ID from the request (assuming traceIdMiddleware is used first)
  const traceId = req.traceId || null;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.userId : null,
      traceId: traceId
    };

    if (res.statusCode >= 400 && res.statusCode < 500) {
      logger.warn('Client Error', logData);
    } else if (res.statusCode >= 500) {
      logger.error('Server Error', logData);
    } else {
      logger.info('Request Completed', logData);
    }
  });

  logger.info('Request Started', {
    method: req.method,
    url: originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.userId : null,
    traceId: traceId
  });

  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  logger.error('Unhandled Error', {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.userId : null,
    traceId: req.traceId || null
  });

  next(error);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};