const logger = require('../utils/logger');

// Environment-specific CORS configuration
function getCorsConfigForEnv(environment) {
  const environmentCorsConfig = {
    development: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3002'
      ],
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Requested-With',
        'X-Forwarded-For',
        'X-Real-IP',
        'User-Agent',
        'X-CSRF-Token'
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Total-Pages',
        'X-Page',
        'X-Limit',
        'Authorization',
        'Content-Disposition',
        'Link'
      ]
    },
    staging: {
      origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [process.env.FRONTEND_URL || 'https://staging.contralock.com'],
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Requested-With',
        'X-Forwarded-For',
        'X-Real-IP',
        'User-Agent',
        'X-CSRF-Token'
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Total-Pages',
        'X-Page',
        'X-Limit',
        'Authorization',
        'Content-Disposition',
        'Link'
      ]
    },
    production: {
      origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [process.env.FRONTEND_URL || 'https://contralock.com'],
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Requested-With',
        'X-Forwarded-For',
        'X-Real-IP',
        'User-Agent'
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Total-Pages',
        'X-Page',
        'X-Limit',
        'Authorization',
        'Content-Disposition',
        'Link'
      ]
    }
  };

  return environmentCorsConfig[environment] || environmentCorsConfig.development;
}

// Function to get CORS configuration based on environment
function getCorsConfig(environment = process.env.NODE_ENV || 'development') {
  const config = getCorsConfigForEnv(environment);

  // Log CORS configuration in non-production environments
  if (environment !== 'production') {
    logger.info('CORS configuration loaded', {
      environment,
      allowedOrigins: config.origin,
      credentials: config.credentials
    });
  }

  return config;
}

// Advanced CORS configuration with dynamic origin checking
function getAdvancedCorsConfig() {
  const baseConfig = getCorsConfig();
  
  // Enhanced configuration with dynamic origin validation
  return {
    ...baseConfig,
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in the allowed list
      const allowedOrigins = Array.isArray(baseConfig.origin) ? baseConfig.origin : [baseConfig.origin];
      
      // For production, implement stricter validation
      if (process.env.NODE_ENV === 'production') {
        // Allow subdomains of the main domain
        const mainDomain = new URL(allowedOrigins[0]).hostname.replace('www.', '');
        const isSubdomain = origin.includes(mainDomain) && !origin.includes('evil.com'); // Basic protection against malicious domains
        
        // Check exact match or subdomain match
        const isAllowed = allowedOrigins.includes(origin) || isSubdomain;
        
        if (!isAllowed) {
          logger.warn('CORS blocked', { origin, allowedOrigins });
        }
        
        return callback(null, isAllowed);
      } else {
        // In development and staging, more permissive
        const isAllowed = allowedOrigins.includes(origin);
        return callback(null, isAllowed);
      }
    },
    // Add pre-flight cache for better performance
    maxAge: 86400, // 24 hours
    // Add additional security headers
    preflightContinue: false
  };
}

module.exports = {
  getCorsConfig,
  getAdvancedCorsConfig
};