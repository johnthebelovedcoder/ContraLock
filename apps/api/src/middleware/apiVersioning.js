// Advanced API versioning with proper deprecation and compatibility handling
const { logger } = require('../middleware/logging');

class ApiVersioningService {
  constructor() {
    // Define supported API versions and their lifecycle
    this.versions = {
      'v1': {
        status: 'deprecated', // Old version
        deprecationDate: new Date('2023-12-31'),
        migrationGuide: '/docs/v1-to-v2-migration'
      },
      'v2': {
        status: 'current', // Current stable version
        releaseDate: new Date('2024-01-01'),
        supportUntil: new Date('2026-01-01') // Supports for 2 years from release
      },
      'v3': {
        status: 'beta', // Beta version for testing
        releaseDate: new Date(),
        stability: 'beta'
      }
    };
    
    // Default version to use when none is specified
    this.defaultVersion = 'v2';
    
    // API lifecycle configuration
    this.lifecycle = {
      development: 6, // months in development
      beta: 3, // months in beta
      current: 24, // months in current (stable)
      deprecated: 6 // months of deprecated support
    };
    
    // Feature flags for gradual rollout
    this.featureFlags = {
      newPaymentFlow: ['v3'],
      enhancedAuth: ['v3'],
      realTimeNotifications: ['v3'],
      aiFeatures: ['v3']
    };
  }

  // Middleware to handle API versioning
  versionMiddleware() {
    return (req, res, next) => {
      // Extract version from various possible sources
      let version = this.extractVersion(req);
      
      // Validate the requested version
      if (!this.isVersionSupported(version)) {
        version = this.defaultVersion; // Fall back to default
        req.apiVersion = version;
        req.isVersionFallback = true;
        
        // Add warning header for clients
        res.setHeader('X-API-Warning', `Unsupported version requested, falling back to ${version}`);
        logger.warn('API version fallback', {
          requestedVersion: req.headers['api-version'] || req.query.version || 'none',
          actualVersion: version,
          url: req.originalUrl,
          method: req.method,
          userAgent: req.get('User-Agent')
        });
      } else {
        req.apiVersion = version;
      }

      // Add version info to response headers
      res.setHeader('X-API-Version', version);
      res.setHeader('X-API-Status', this.versions[version].status);
      
      // Add deprecation headers if needed
      if (this.versions[version].status === 'deprecated') {
        const deprecationDate = this.versions[version].deprecationDate;
        res.setHeader('X-API-Deprecation-Date', deprecationDate.toISOString());
        res.setHeader('X-API-Migration-Guide', this.versions[version].migrationGuide);
      }
      
      // Check for feature availability based on version
      req.availableFeatures = this.getFeaturesByVersion(version);
      
      // Continue with request processing
      next();
    };
  }

  // Extract version from request (multiple sources)
  extractVersion(req) {
    // 1. Check custom header first
    if (req.headers['api-version']) {
      return req.headers['api-version'].toLowerCase();
    }
    
    // 2. Check query parameter
    if (req.query.version) {
      return req.query.version.toLowerCase();
    }
    
    // 3. Check Accept header
    if (req.headers['accept']) {
      const acceptHeader = req.headers['accept'];
      const versionMatch = acceptHeader.match(/version=(v\d+)/i);
      if (versionMatch) {
        return versionMatch[1].toLowerCase();
      }
    }
    
    // 4. Check URL path for /api/vX/ pattern
    if (req.path.startsWith('/api/')) {
      const pathParts = req.path.split('/');
      if (pathParts.length >= 3 && pathParts[2].match(/^v\d+$/)) {
        return pathParts[2].toLowerCase();
      }
    }
    
    // Default to default version
    return this.defaultVersion;
  }

  // Check if version is supported
  isVersionSupported(version) {
    return this.versions.hasOwnProperty(version) && 
           this.versions[version].status !== 'deprecated';
  }

  // Get features available for a specific version
  getFeaturesByVersion(version) {
    const features = ['basic-api', 'authentication', 'user-management'];
    
    // Add version-specific features
    if (version === 'v2') {
      features.push('enhanced-security', 'improved-errors', 'better-pagination');
    }
    
    if (version === 'v3') {
      features.push('enhanced-security', 'improved-errors', 'better-pagination', 
                   'real-time-features', 'ai-integration');
    }
    
    // Add feature flags based on version
    Object.keys(this.featureFlags).forEach(feature => {
      if (this.featureFlags[feature].includes(version)) {
        features.push(feature);
      }
    });
    
    return features;
  }

  // Get API status information
  getApiStatus() {
    const status = {};
    
    Object.keys(this.versions).forEach(version => {
      const versionInfo = { ...this.versions[version] };
      
      if (versionInfo.status === 'deprecated' && versionInfo.deprecationDate) {
        versionInfo.daysUntilRemoval = 
          Math.ceil((new Date(versionInfo.deprecationDate) - new Date()) / (1000 * 60 * 60 * 24));
      }
      
      status[version] = versionInfo;
    });
    
    return {
      defaultVersion: this.defaultVersion,
      versions: status,
      current: this.getCurrentVersion(),
      latest: this.getLatestVersion()
    };
  }

  // Get current stable version
  getCurrentVersion() {
    return Object.keys(this.versions).find(v => this.versions[v].status === 'current');
  }

  // Get latest version (including beta)
  getLatestVersion() {
    return Object.keys(this.versions).pop(); // Assuming versions are in order
  }

  // Check if a feature is available in a version
  isFeatureAvailable(version, feature) {
    const features = this.getFeaturesByVersion(version);
    return features.includes(feature);
  }

  // Generate version compatibility report
  async generateCompatibilityReport() {
    const report = {
      versions: {},
      compatibility: {},
      migrationPaths: {},
      status: 'active'
    };

    for (const version in this.versions) {
      report.versions[version] = {
        status: this.versions[version].status,
        features: this.getFeaturesByVersion(version),
        releaseDate: this.versions[version].releaseDate,
        supportUntil: this.versions[version].supportUntil || null
      };
    }

    return report;
  }

  // Handle version-specific routing
  versionedRoute(version, routeHandler) {
    return (req, res, next) => {
      if (req.apiVersion === version) {
        return routeHandler(req, res, next);
      }
      next(); // Skip if not the right version
    };
  }
}

module.exports = new ApiVersioningService();
module.exports.ApiVersioningService = ApiVersioningService;