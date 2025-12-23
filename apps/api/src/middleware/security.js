const sanitize = require('express-mongo-sanitize'); // This will help prevent NoSQL injection
const validator = require('validator');

// Middleware to sanitize input and prevent injection attacks
const sanitizeInput = (req, res, next) => {
  // Sanitize all request body fields to prevent NoSQL injection
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params);
  }

  next();
};

// Enhanced validation middleware for common patterns
const validateInput = {
  // Validate email format
  email: (value) => {
    return validator.isEmail(value);
  },

  // Validate URL format
  url: (value) => {
    return validator.isURL(value, { protocols: ['http', 'https'] });
  },

  // Validate mongo ID
  mongoId: (value) => {
    return validator.isMongoId(value);
  },

  // Validate string
  string: (value, options = {}) => {
    const { min, max, noSpecialChars } = options;
    if (min && value.length < min) return false;
    if (max && value.length > max) return false;
    if (noSpecialChars && /[^a-zA-Z0-9\s]/.test(value)) return false;
    return true;
  },

  // Validate number
  number: (value, options = {}) => {
    const { min, max } = options;
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    return true;
  },

  // Sanitize text to prevent XSS
  sanitizeText: (text) => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
};

// XSS protection middleware
const sanitizeText = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = validateInput.sanitizeText(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = sanitizeObject(obj[key]);
      }
    }

    return obj;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  next();
};

// Custom XSS middleware (instead of using deprecated xss-clean)
const xssClean = (req, res, next) => {
  const clean = (obj) => {
    if (typeof obj === 'string') {
      // Basic XSS prevention
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Remove script tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')  // Remove iframe tags
        .replace(/javascript:/gi, '')  // Remove javascript protocol
        .replace(/on\w+="[^"]*"/gi, '')  // Remove event handlers
        .replace(/<[^>]*>/g, '');  // Remove other HTML tags
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = clean(obj[key]);
      }
    }
    return obj;
  };

  // Clean the body
  if (req.body && typeof req.body === 'object') {
    req.body = clean(req.body);
  }

  // Clean query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = clean(req.query);
  }

  next();
};

module.exports = {
  sanitizeInput,
  validateInput,
  sanitizeText,
  xssClean
};