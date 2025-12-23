// apps/api/src/utils/logger.js
const fs = require('fs');
const path = require('path');

// Create log directory if it doesn't exist
const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log file paths
const errorLogPath = path.join(logDir, 'error.log');
const combinedLogPath = path.join(logDir, 'combined.log');

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = logLevels[process.env.LOG_LEVEL || 'INFO'];

const logToFile = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} [${level}] ${message} ${JSON.stringify(meta)}\n`;
  
  // Write to combined log
  fs.appendFileSync(combinedLogPath, logEntry);
  
  // Write to error log if it's an error
  if (level === 'ERROR') {
    fs.appendFileSync(errorLogPath, logEntry);
  }
};

const logger = {
  error: (message, meta = {}) => {
    if (currentLogLevel >= logLevels.ERROR) {
      console.error(`[ERROR] ${message}`, meta);
      logToFile('ERROR', message, meta);
    }
  },
  
  warn: (message, meta = {}) => {
    if (currentLogLevel >= logLevels.WARN) {
      console.warn(`[WARN] ${message}`, meta);
      logToFile('WARN', message, meta);
    }
  },
  
  info: (message, meta = {}) => {
    if (currentLogLevel >= logLevels.INFO) {
      console.info(`[INFO] ${message}`, meta);
      logToFile('INFO', message, meta);
    }
  },
  
  debug: (message, meta = {}) => {
    if (currentLogLevel >= logLevels.DEBUG) {
      console.log(`[DEBUG] ${message}`, meta);
      logToFile('DEBUG', message, meta);
    }
  }
};

module.exports = logger;