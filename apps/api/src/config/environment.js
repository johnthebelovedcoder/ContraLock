const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Configuration schema for validation
const configSchema = {
  // Server settings
  PORT: { type: 'number', default: 3001, required: false },
  NODE_ENV: { type: 'string', default: 'development', allowed: ['development', 'staging', 'production'] },
  
  // Database settings
  DATABASE_URL: { type: 'string', required: false },
  REDIS_URL: { type: 'string', required: false },
  
  // Authentication settings
  JWT_SECRET: { type: 'string', required: true },
  JWT_EXPIRES_IN: { type: 'string', default: '24h', required: false },
  REFRESH_TOKEN_EXPIRES_IN: { type: 'string', default: '7d', required: false },
  
  // Email settings
  EMAIL_HOST: { type: 'string', required: false },
  EMAIL_PORT: { type: 'number', default: 587, required: false },
  EMAIL_USER: { type: 'string', required: false },
  EMAIL_PASS: { type: 'string', required: false },
  EMAIL_SECURE: { type: 'boolean', default: false, required: false },
  EMAIL_FROM: { type: 'string', required: false, default: 'noreply@contralock.com' },
  EMAIL_FROM_NAME: { type: 'string', required: false, default: 'ContraLock' },
  
  // Frontend settings
  FRONTEND_URL: { type: 'string', required: false, default: 'http://localhost:3000' },
  
  // CORS settings
  CORS_ALLOWED_ORIGINS: { type: 'string', required: false },
  
  // Rate limiting settings
  RATE_LIMIT_WINDOW_MS: { type: 'number', default: 900000, required: false }, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: { type: 'number', default: 1000, required: false },
  AUTH_RATE_LIMIT_MAX_REQUESTS: { type: 'number', default: 20, required: false },
  
  // File upload settings
  FILE_UPLOAD_DIR: { type: 'string', default: './uploads', required: false },
  FILE_STORAGE_TYPE: { type: 'string', default: 'local', allowed: ['local', 's3', 'cloudinary'], required: false },
  
  // Payment settings
  STRIPE_SECRET_KEY: { type: 'string', required: false },
  STRIPE_WEBHOOK_SECRET: { type: 'string', required: false },
  STRIPE_RETURN_URL: { type: 'string', required: false },
  
  // AWS settings (for S3)
  AWS_ACCESS_KEY_ID: { type: 'string', required: false },
  AWS_SECRET_ACCESS_KEY: { type: 'string', required: false },
  AWS_REGION: { type: 'string', required: false, default: 'us-east-1' },
  S3_BUCKET_NAME: { type: 'string', required: false },
  
  // Email tracking
  EMAIL_TRACKING: { type: 'boolean', default: false, required: false },
  
  // Logging settings
  LOG_LEVEL: { type: 'string', default: 'info', required: false },
  
  // Social login settings
  GOOGLE_CLIENT_ID: { type: 'string', required: false },
  GOOGLE_CLIENT_SECRET: { type: 'string', required: false },
  LINKEDIN_CLIENT_ID: { type: 'string', required: false },
  LINKEDIN_CLIENT_SECRET: { type: 'string', required: false },
  
  // Email service settings
  SMTP_HOST: { type: 'string', required: false },
  SMTP_PORT: { type: 'number', default: 587, required: false },
  SMTP_USER: { type: 'string', required: false },
  SMTP_PASSWORD: { type: 'string', required: false },
  
  // Email retry settings
  EMAIL_MAX_RETRIES: { type: 'number', default: 3, required: false },
  EMAIL_RETRY_DELAY: { type: 'number', default: 1000, required: false }
};

class EnvironmentConfig {
  constructor() {
    this.config = {};
    this.errors = [];
    this.warnings = [];
    this.isInitialized = false;
  }

  // Initialize the configuration
  async initialize() {
    if (this.isInitialized) {
      return this.config;
    }

    try {
      // Load environment variables from .env files
      this.loadEnvironmentVariables();
      
      // Validate configuration
      this.validateConfig();
      
      // Set configuration values with defaults
      this.setConfigWithDefaults();
      
      // Log configuration status
      this.logConfigStatus();
      
      this.isInitialized = true;
      
      return this.config;
    } catch (error) {
      logger.error('Configuration initialization failed', { error: error.message });
      throw error;
    }
  }

  // Load environment variables from .env files
  loadEnvironmentVariables() {
    const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
    const envPath = path.join(process.cwd(), envFile);
    
    // Try to load environment-specific file first
    if (fs.existsSync(envPath)) {
      this.loadEnvFile(envPath);
      logger.info(`Environment file loaded: ${envFile}`);
    }
    
    // Always load base .env file
    const baseEnvPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(baseEnvPath) && baseEnvPath !== envPath) {
      this.loadEnvFile(baseEnvPath);
      logger.info('Base environment file loaded: .env');
    }
    
    // Load local override if it exists (for local development)
    const localEnvPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(localEnvPath)) {
      this.loadEnvFile(localEnvPath);
      logger.info('Local environment file loaded: .env.local');
    }
  }

  // Load a single .env file
  loadEnvFile(filePath) {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...value] = line.split('=');
        if (key && value) {
          // Handle values with = inside them
          const fullValue = value.join('=').trim();
          
          // Remove quotes if present
          const unquotedValue = fullValue.replace(/^["']|["']$/g, '');
          
          // Only set if not already defined (environment variables take precedence)
          if (!process.env[key?.trim()]) {
            process.env[key.trim()] = unquotedValue;
          }
        }
      }
    }
  }

  // Validate configuration against schema
  validateConfig() {
    for (const [key, rules] of Object.entries(configSchema)) {
      const value = process.env[key];
      
      // Check if required field is present
      if (rules.required && !value) {
        this.errors.push(`Required configuration variable missing: ${key}`);
        continue;
      }
      
      // Skip validation if value is not provided and not required
      if (!value) continue;
      
      // Type validation
      let parsedValue = value;
      if (rules.type === 'number') {
        parsedValue = Number(value);
        if (isNaN(parsedValue)) {
          this.errors.push(`Invalid type for ${key}: expected number, got ${typeof value}`);
          continue;
        }
      } else if (rules.type === 'boolean') {
        parsedValue = value.toLowerCase() === 'true';
      }
      
      // Allowed values validation
      if (rules.allowed && !rules.allowed.includes(String(parsedValue))) {
        this.errors.push(`Invalid value for ${key}: ${parsedValue}. Allowed values: ${rules.allowed.join(', ')}`);
        continue;
      }
    }
    
    if (this.errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${this.errors.join('\n')}`);
    }
  }

  // Set configuration values with defaults
  setConfigWithDefaults() {
    for (const [key, rules] of Object.entries(configSchema)) {
      let value = process.env[key];
      
      // Use default if not set
      if (value === undefined || value === null || value === '') {
        value = rules.default;
      }
      
      // Type conversion
      if (value !== undefined && value !== null) {
        if (rules.type === 'number') {
          value = Number(value);
        } else if (rules.type === 'boolean') {
          value = String(value).toLowerCase() === 'true';
        }
      }
      
      this.config[key] = value;
    }
  }

  // Log configuration status
  logConfigStatus() {
    const env = this.config.NODE_ENV;
    
    if (env !== 'production') {
      logger.info('Configuration loaded successfully', {
        environment: env,
        port: this.config.PORT,
        databaseUrlSet: !!this.config.DATABASE_URL,
        stripeConfigured: !!this.config.STRIPE_SECRET_KEY,
        emailConfigured: !!(this.config.EMAIL_HOST && this.config.EMAIL_USER),
        redisConfigured: !!this.config.REDIS_URL
      });
    }
    
    if (this.warnings.length > 0) {
      logger.warn('Configuration warnings', { warnings: this.warnings });
    }
  }

  // Get a configuration value
  get(key) {
    if (!this.isInitialized) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    
    return this.config[key];
  }

  // Check if running in production
  isProduction() {
    return this.get('NODE_ENV') === 'production';
  }

  // Check if running in development
  isDevelopment() {
    return this.get('NODE_ENV') === 'development';
  }

  // Check if running in staging
  isStaging() {
    return this.get('NODE_ENV') === 'staging';
  }

  // Get all configuration
  getAll() {
    if (!this.isInitialized) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    
    return { ...this.config };
  }

  // Validate that critical configuration is present
  validateCriticalConfig() {
    const criticalChecks = [
      { key: 'JWT_SECRET', name: 'JWT Secret' },
      { key: 'NODE_ENV', name: 'Environment' }
    ];

    const missingCritical = criticalChecks.filter(check => !this.config[check.key]);
    
    if (missingCritical.length > 0) {
      const missingNames = missingCritical.map(check => check.name);
      logger.error('Critical configuration missing', { missing: missingNames });
      throw new Error(`Critical configuration missing: ${missingNames.join(', ')}`);
    }
  }
}

// Create and export a singleton instance
const environmentConfig = new EnvironmentConfig();

module.exports = environmentConfig;