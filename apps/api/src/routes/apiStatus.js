// API status and version information endpoint
const express = require('express');
const apiVersioningService = require('../middleware/apiVersioning');
const { requireRole } = require('../middleware/authorization');
const { logger } = require('../middleware/logging');

const router = express.Router();

// Get API status and version information
router.get('/', (req, res) => {
  try {
    const status = apiVersioningService.getApiStatus();
    
    logger.info('API status requested', {
      version: req.apiVersion,
      clientVersion: req.headers['api-version'],
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    res.json({
      status: 'active',
      message: 'API is operating normally',
      timestamp: new Date().toISOString(),
      version: req.apiVersion,
      ...status
    });
  } catch (error) {
    logger.error('Error getting API status', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get API status',
      timestamp: new Date().toISOString()
    });
  }
});

// Get detailed version compatibility report (admin only)
router.get('/compatibility', requireRole('admin'), async (req, res) => {
  try {
    const report = await apiVersioningService.generateCompatibilityReport();
    
    logger.info('API compatibility report requested', {
      version: req.apiVersion,
      userId: req.user._id,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      ...report
    });
  } catch (error) {
    logger.error('Error generating API compatibility report', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate compatibility report',
      timestamp: new Date().toISOString()
    });
  }
});

// Get current version information
router.get('/current', (req, res) => {
  try {
    const currentVersion = apiVersioningService.getCurrentVersion();
    const versionInfo = apiVersioningService.versions[currentVersion];
    
    res.json({
      version: currentVersion,
      status: 'current',
      info: versionInfo,
      features: apiVersioningService.getFeaturesByVersion(currentVersion),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting current API version', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get current version info'
    });
  }
});

// Get specific version documentation
router.get('/docs/:version', (req, res) => {
  const version = req.params.version.toLowerCase();
  
  if (!apiVersioningService.versions[version]) {
    return res.status(404).json({
      status: 'error',
      message: `Version ${version} not found`
    });
  }
  
  // In a real implementation, this would return version-specific documentation
  // For now, we'll return basic version info
  res.json({
    version,
    status: apiVersioningService.versions[version].status,
    documentation: `Documentation for API version ${version} would be available here`,
    endpoints: [
      '/api/v2/auth',
      '/api/v2/users', 
      '/api/v2/projects',
      '/api/v2/milestones',
      '/api/v2/payments'
    ],
    changes: version === 'v3' ? [
      'Added real-time notifications',
      'Enhanced AI features',
      'Improved security measures'
    ] : []
  });
});

// Health check endpoint that considers API versioning
router.get('/health', (req, res) => {
  const status = apiVersioningService.getApiStatus();
  
  // Determine health based on version status
  const currentVersion = status.current || status.latest;
  const currentVersionStatus = status.versions[currentVersion]?.status;
  
  const isHealthy = currentVersionStatus === 'current' || currentVersionStatus === 'beta';
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    version: req.apiVersion,
    currentVersion: currentVersion,
    versionStatus: currentVersionStatus,
    timestamp: new Date().toISOString(),
    service: 'api-versioning'
  });
});

module.exports = router;