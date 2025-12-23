// apps/api/src/middleware/errorHandler.js
const { AppError } = require('../errors/AppError');
const logger = require('../utils/logger');
const errorMonitoringService = require('../services/errorMonitoringService');

/**
 * Global error handling middleware
 * This middleware should be the last middleware in the stack
 */
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Report error to monitoring service with context
  errorMonitoringService.reportError(err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.userId : null,
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}`;
    error = new AppError(message, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Invalid JSON format', 400);
  }

  // Handle multer file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large', 413);
  }

  // Handle multer file count errors
  if (err.code === 'LIMIT_FILE_COUNT') {
    error = new AppError('Too many files', 400);
  }

  // Handle multer errors
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new AppError('Unexpected field in form data', 400);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    status: error.status || 'error',
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    ...(error.errors && { errors: error.errors }),
    errorId: error.id || null // Include error ID for support reference
  });
};

/**
 * Not Found Handler - 404 for routes that don't exist
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  globalErrorHandler,
  notFoundHandler
};