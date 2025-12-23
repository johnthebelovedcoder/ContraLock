// apps/api/src/errors/AppError.js
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// 400 Bad Request - Client sent invalid data
class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

// 401 Unauthorized - Authentication required
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

// 403 Forbidden - Authenticated but no access
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

// 404 Not Found - Resource doesn't exist
class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

// 409 Conflict - Resource conflict (e.g., duplicate email)
class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

// 422 Unprocessable Entity - Validation errors
class ValidationError extends AppError {
  constructor(message = 'Validation Error', errors = null) {
    super(message, 422);
    this.errors = errors;
  }
}

// 429 Too Many Requests - Rate limiting
class RateLimitError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429);
  }
}

// 500 Internal Server Error - Generic server error
class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}

// 502 Bad Gateway - Error from upstream service
class BadGatewayError extends AppError {
  constructor(message = 'Bad Gateway') {
    super(message, 502);
  }
}

// 503 Service Unavailable - Service temporarily unavailable
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service Unavailable') {
    super(message, 503);
  }
}

// Specific domain errors
class EmailError extends AppError {
  constructor(message = 'Email Error') {
    super(message, 500);
  }
}

class PaymentError extends AppError {
  constructor(message = 'Payment Error') {
    super(message, 500);
  }
}

class FileUploadError extends AppError {
  constructor(message = 'File Upload Error') {
    super(message, 500);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database Error') {
    super(message, 500);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  EmailError,
  PaymentError,
  FileUploadError,
  DatabaseError
};