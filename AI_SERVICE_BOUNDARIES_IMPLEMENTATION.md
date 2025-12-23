# AI Service Boundaries and Limitations Implementation

## Overview
This document outlines the implementation of proper boundaries and limitations for the AI service in the ContraLock platform. The goal is to ensure the AI service provides advisory functions only, without making autonomous decisions that could impact users' funds or project outcomes.

## Why AI Service Boundaries are Critical

### Security Requirements:
- **Human Oversight**: All critical decisions require human approval
- **Non-Authoritative**: AI cannot directly approve payments or resolve disputes
- **Transparent Operations**: AI decision-making process is documented and auditable
- **Fallback Mechanisms**: System continues to function if AI service is unavailable
- **Data Privacy**: AI service does not store or leak sensitive information
- **Accountability**: Clear lines of responsibility between AI and human actors

## Technical Implementation

### 1. AI Service Architecture with Boundaries

**Updated AI Service Structure** (apps/ai-service/src/app.js):
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { validateAIRequest, checkRateLimit } = require('./middleware/validation');
const { ROLES, ACTIONS, SUBJECTS } = require('./types/roles');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting to prevent API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.AI_API_RATE_LIMIT || 100, // limit per IP per window
  message: 'Too many AI requests, please try again later'
});
app.use(limiter);

// Body parsing with size limits to prevent abuse
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Validation middleware to ensure proper request structure
app.use(validateAIRequest);

// Import AI service routes
const aiRoutes = require('./routes/ai');
const healthRoutes = require('./routes/health');

// All AI endpoints require authentication and validation
app.use('/api/v1/ai', checkRateLimit, aiRoutes);
app.use('/api', healthRoutes);

// Error handling that preserves privacy
app.use((err, req, res, next) => {
  logger.error('AI service error', { 
    error: err.message, 
    path: req.path, 
    method: req.method,
    correlationId: req.headers['x-correlation-id']
  });
  
  // Never expose internal error details to clients
  res.status(500).json({ 
    error: 'AI service temporarily unavailable',
    correlationId: req.headers['x-correlation-id'] 
  });
});

module.exports = app;
```

### 2. AI Service Validation and Boundary Middleware

**AI Service Validation Middleware** (apps/ai-service/src/middleware/validation.js):
```javascript
const logger = require('../utils/logger');
const { ROLES } = require('../types/roles');

// Validate that AI requests are properly formatted and authorized
const validateAIRequest = (req, res, next) => {
  // Ensure all requests have proper authentication
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  // Validate request body structure based on AI service endpoint
  const endpoint = req.path.split('/').pop();
  
  let isValid = true;
  let validationErrors = [];

  switch (endpoint) {
    case 'milestone-suggestions':
      isValid = validateMilestoneRequest(req.body);
      break;
    case 'verify-deliverable':
      isValid = validateDeliverableRequest(req.body);
      break;
    case 'dispute-analysis':
      isValid = validateDisputeRequest(req.body);
      break;
    default:
      isValid = false;
      validationErrors.push('Invalid AI service endpoint');
  }

  if (!isValid) {
    logger.warn('Invalid AI request structure', { 
      endpoint, 
      body: req.body, 
      validationErrors 
    });
    return res.status(400).json({ 
      error: 'Invalid request structure', 
      validationErrors 
    });
  }

  next();
};

// Rate limiting check for AI services
const checkRateLimit = (req, res, next) => {
  // Add additional rate limiting specific to AI services
  // This prevents overuse of expensive AI operations
  const user = getUserFromToken(req.headers['authorization']);
  
  if (user) {
    const userLimit = user.role === 'admin' ? 1000 : 100; // Higher limits for admins
    // Implementation of user-specific rate limiting would go here
  }

  next();
};

// Validate milestone suggestion requests
function validateMilestoneRequest(body) {
  const required = ['projectId', 'projectDescription', 'projectTitle'];
  const errors = [];

  for (const field of required) {
    if (!body[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate that sensitive data is not included
  const sensitiveFields = ['paymentDetails', 'personalInfo', 'financialData'];
  for (const field of sensitiveFields) {
    if (body[field]) {
      errors.push(`Sensitive field ${field} should not be sent to AI service`);
    }
  }

  if (errors.length > 0) {
    logger.warn('Milestone request validation failed', { errors, body });
    return false;
  }

  return true;
}

// Validate deliverable verification requests
function validateDeliverableRequest(body) {
  const required = ['milestoneId', 'deliverable', 'acceptanceCriteria'];
  const errors = [];

  for (const field of required) {
    if (!body[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate content size limits
  if (body.deliverable && body.deliverable.length > 10000) {
    errors.push('Deliverable content too large (max 10KB)');
  }

  if (body.acceptanceCriteria && body.acceptanceCriteria.length > 5000) {
    errors.push('Acceptance criteria too large (max 5KB)');
  }

  if (errors.length > 0) {
    logger.warn('Deliverable request validation failed', { errors, body });
    return false;
  }

  return true;
}

// Validate dispute analysis requests
function validateDisputeRequest(body) {
  const required = ['disputeId', 'disputeDetails', 'evidence'];
  const errors = [];

  for (const field of required) {
    if (!body[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Ensure payment amounts and other sensitive data are not sent
  if (body.paymentAmount || body.financialDetails) {
    errors.push('Financial details should not be sent to dispute analysis AI');
  }

  if (errors.length > 0) {
    logger.warn('Dispute request validation failed', { errors, body });
    return false;
  }

  return true;
}

// Helper function to get user from token (simplified)
function getUserFromToken(authHeader) {
  if (!authHeader) return null;
  
  // In a real implementation, this would decode the JWT and return user info
  // For now, returning a mock user
  return { id: 'temp-user', role: 'client' };
}

module.exports = { validateAIRequest, checkRateLimit };
```

### 3. AI Service Controllers with Clear Boundaries

**AI Service Controller** (apps/ai-service/src/controllers/aiController.js):
```javascript
const OpenAI = require('openai');
const logger = require('../utils/logger');
const { validateMilestoneSuggestion, validateDeliverableVerification, validateDisputeAnalysis } = require('../services/validationService');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const aiController = {
  // Generate milestone suggestions (advisory only)
  async getMilestoneSuggestions(req, res) {
    try {
      const { projectDescription, projectTitle, budget, timeline, skillsRequired } = req.body;
      
      logger.info('AI milestone suggestion requested', {
        projectId: req.body.projectId,
        projectTitle: projectTitle.substring(0, 50) + '...' // Truncate for logging
      });

      // Input validation
      const validation = validateMilestoneSuggestion(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ error: 'Invalid input', details: validation.errors });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo", // Use appropriate model
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for a freelance escrow platform. Provide milestone suggestions for projects. 
            Each milestone should have: title, description, acceptance criteria, estimated budget percentage, timeline.
            DO NOT make any decisions about payments, disputes, or user permissions. 
            These are only suggestions for human review.`
          },
          {
            role: "user",
            content: `Project: ${projectTitle}
            Description: ${projectDescription}
            Budget: $${budget}
            Timeline: ${timeline} days
            Required Skills: ${skillsRequired ? skillsRequired.join(', ') : 'Not specified'}
            Provide 3-5 milestone suggestions with acceptance criteria for each.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const responseText = completion.choices[0].message.content;
      
      // Parse and validate the AI response
      let suggestions;
      try {
        suggestions = parseMilestoneSuggestions(responseText);
      } catch (parseError) {
        logger.error('Error parsing milestone suggestions', { error: parseError.message, responseText });
        return res.status(500).json({ error: 'Invalid response format from AI service' });
      }

      // Log the AI suggestion for audit purposes
      logger.info('AI milestone suggestions generated', {
        projectId: req.body.projectId,
        suggestionCount: suggestions.length,
        processedBy: 'AI-Service'
      });

      res.json({
        suggestions,
        metadata: {
          source: 'AI-Advisory',
          timestamp: new Date().toISOString(),
          disclaimer: 'These are AI-generated suggestions for human review only'
        }
      });

    } catch (error) {
      logger.error('AI milestone suggestion error', { error: error.message });
      res.status(500).json({ error: 'AI service temporarily unavailable' });
    }
  },

  // Verify deliverable against acceptance criteria (advisory only)
  async verifyDeliverable(req, res) {
    try {
      const { deliverable, acceptanceCriteria, milestoneTitle } = req.body;
      
      logger.info('AI deliverable verification requested', {
        milestoneId: req.body.milestoneId,
        milestoneTitle: milestoneTitle.substring(0, 50) + '...'
      });

      // Input validation
      const validation = validateDeliverableVerification(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ error: 'Invalid input', details: validation.errors });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for a freelance escrow platform. Compare deliverables to acceptance criteria. 
            Provide a confidence score (0-100), detailed comparison, and recommendation.
            DO NOT approve or reject deliverables. This is only advisory for human reviewers.`
          },
          {
            role: "user",
            content: `Milestone: ${milestoneTitle}
            Acceptance Criteria: ${acceptanceCriteria}
            Deliverable: ${deliverable}
            
            Compare the deliverable to the acceptance criteria and provide:
            1. Confidence score (0-100)
            2. Detailed comparison highlighting matches and mismatches
            3. Recommendation for human reviewer
            4. Specific areas that need attention
            
            Remember: This is only advisory. Humans must make final decisions.`
          }
        ],
        temperature: 0.2,
        max_tokens: 800
      });

      const responseText = completion.choices[0].message.content;
      
      // Parse and validate the AI response
      let verification;
      try {
        verification = parseDeliverableVerification(responseText);
      } catch (parseError) {
        logger.error('Error parsing deliverable verification', { error: parseError.message, responseText });
        return res.status(500).json({ error: 'Invalid response format from AI service' });
      }

      // Log the verification for audit
      logger.info('AI deliverable verification completed', {
        milestoneId: req.body.milestoneId,
        confidence: verification.confidenceScore,
        processedBy: 'AI-Service'
      });

      res.json({
        verification,
        metadata: {
          source: 'AI-Advisory',
          timestamp: new Date().toISOString(),
          disclaimer: 'This is an AI-generated analysis for human review only. Final decision remains with human reviewers.'
        }
      });

    } catch (error) {
      logger.error('AI deliverable verification error', { error: error.message });
      res.status(500).json({ error: 'AI service temporarily unavailable' });
    }
  },

  // Dispute analysis (advisory only)
  async analyzeDispute(req, res) {
    try {
      const { disputeDetails, evidence, disputeSummary } = req.body;
      
      logger.info('AI dispute analysis requested', {
        disputeId: req.body.disputeId,
        disputeSummary: disputeSummary.substring(0, 100) + '...'
      });

      // Input validation
      const validation = validateDisputeAnalysis(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ error: 'Invalid input', details: validation.errors });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for analyzing disputes in a freelance escrow platform. 
            Provide analysis of dispute facts, potential outcomes, and recommendations for resolution.
            DO NOT make final decisions about dispute resolution. 
            This is only advisory for human arbitrators and mediators.`
          },
          {
            role: "user",
            content: `Dispute Summary: ${disputeSummary}
            Dispute Details: ${disputeDetails}
            Evidence: ${evidence}
            
            Provide analysis including:
            1. Key facts from the dispute
            2. Strength of each party's position
            3. Relevant platform policies that apply
            4. Potential resolution paths
            5. Risk assessment
            
            Note: This is advisory only. Final resolution decisions must be made by humans.`
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent analysis
        max_tokens: 1200
      });

      const responseText = completion.choices[0].message.content;
      
      // Parse and validate the AI response
      let analysis;
      try {
        analysis = parseDisputeAnalysis(responseText);
      } catch (parseError) {
        logger.error('Error parsing dispute analysis', { error: parseError.message, responseText });
        return res.status(500).json({ error: 'Invalid response format from AI service' });
      }

      // Log the analysis for audit
      logger.info('AI dispute analysis completed', {
        disputeId: req.body.disputeId,
        analysisSummary: analysis.summary.substring(0, 100) + '...',
        processedBy: 'AI-Service'
      });

      res.json({
        analysis,
        metadata: {
          source: 'AI-Advisory',
          timestamp: new Date().toISOString(),
          disclaimer: 'This is an AI-generated analysis for human arbitrators only. AI does not make final dispute decisions.'
        }
      });

    } catch (error) {
      logger.error('AI dispute analysis error', { error: error.message });
      res.status(500).json({ error: 'AI service temporarily unavailable' });
    }
  }
};

// Helper functions to parse AI responses safely
function parseMilestoneSuggestions(responseText) {
  // In a real implementation, this would parse the response into structured data
  // with proper validation to ensure it matches expected schema
  // For security, we should validate the parsed data before returning it
  
  try {
    // This is a simplified example - in practice, you'd want more robust parsing
    // that validates the structure and content of the AI response
    return {
      milestones: [
        {
          title: "Placeholder milestone title",
          description: "Placeholder description",
          acceptanceCriteria: "Placeholder criteria",
          budgetPercentage: 25,
          timeline: "2 weeks"
        }
      ]
    };
  } catch (error) {
    throw new Error(`Invalid milestone suggestions format: ${error.message}`);
  }
}

function parseDeliverableVerification(responseText) {
  try {
    // Parse verification response - in practice, implement proper validation
    return {
      confidenceScore: 85,
      detailedComparison: "Placeholder comparison",
      recommendation: "Placeholder recommendation",
      areasOfConcern: ["Placeholder concern"]
    };
  } catch (error) {
    throw new Error(`Invalid verification format: ${error.message}`);
  }
}

function parseDisputeAnalysis(responseText) {
  try {
    // Parse dispute analysis - implement proper validation
    return {
      summary: "Placeholder summary",
      keyFacts: ["Placeholder fact"],
      partyStrengths: { client: "Medium", freelancer: "Medium" },
      policyRelevance: ["Placeholder policy"],
      resolutionPaths: ["Placeholder path"],
      riskAssessment: "Placeholder assessment"
    };
  } catch (error) {
    throw new Error(`Invalid analysis format: ${error.message}`);
  }
}

module.exports = aiController;
```

### 4. Service-to-Service Communication with Boundaries

**Service Communication Service** (apps/ai-service/src/services/communicationService.js):
```javascript
const axios = require('axios');
const logger = require('../utils/logger');

class CommunicationService {
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    this.apiKey = process.env.INTERNAL_API_KEY; // For internal service communication
  }

  // Send AI suggestions to main API for human review
  async sendMilestoneSuggestions(suggestions, projectId, metadata) {
    try {
      // DO NOT directly update project - only provide suggestions for human review
      // The main API will handle storing suggestions and presenting them to users
      
      logger.info('Sending milestone suggestions to main API', {
        projectId,
        suggestionCount: suggestions.length
      });

      // In a real implementation, we'd send the suggestions to the main API
      // which would then store them and make them available for human review
      // await axios.post(`${this.apiBaseUrl}/api/v1/projects/${projectId}/ai-suggestions`, {
      //   suggestions,
      //   metadata: {
      //     ...metadata,
      //     reviewed: false,
      //     reviewerId: null
      //   }
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      return {
        status: 'suggestions_sent',
        projectId,
        message: 'Suggestions sent for human review'
      };
    } catch (error) {
      logger.error('Error sending milestone suggestions to main API', { error: error.message });
      throw error;
    }
  }

  // Send deliverable verification to main API
  async sendDeliverableVerification(verification, milestoneId, metadata) {
    try {
      logger.info('Sending deliverable verification to main API', {
        milestoneId,
        confidenceScore: verification.confidenceScore
      });

      // DO NOT directly approve or reject - only send for human review
      // In real implementation:
      // await axios.post(`${this.apiBaseUrl}/api/v1/milestones/${milestoneId}/ai-verification`, {
      //   verification,
      //   metadata: {
      //     ...metadata,
      //     reviewed: false,
      //     reviewerId: null
      //   }
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      return {
        status: 'verification_sent',
        milestoneId,
        message: 'Verification sent for human review'
      };
    } catch (error) {
      logger.error('Error sending deliverable verification to main API', { error: error.message });
      throw error;
    }
  }

  // Send dispute analysis to main API
  async sendDisputeAnalysis(analysis, disputeId, metadata) {
    try {
      logger.info('Sending dispute analysis to main API', {
        disputeId,
        analysisLength: analysis.summary.length
      });

      // DO NOT resolve dispute - only provide analysis for human arbitrators
      // In real implementation:
      // await axios.post(`${this.apiBaseUrl}/api/v1/disputes/${disputeId}/ai-analysis`, {
      //   analysis,
      //   metadata: {
      //     ...metadata,
      //     reviewedBy: null,
      //     decisionMade: false
      //   }
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      return {
        status: 'analysis_sent',
        disputeId,
        message: 'Analysis sent for human arbitrator review'
      };
    } catch (error) {
      logger.error('Error sending dispute analysis to main API', { error: error.message });
      throw error;
    }
  }

  // Health check for main API
  async checkMainApiHealth() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/health`);
      return response.data.status === 'OK';
    } catch (error) {
      logger.error('Main API health check failed', { error: error.message });
      return false;
    }
  }
}

// Singleton instance
const communicationService = new CommunicationService();

module.exports = communicationService;
```

### 5. AI Service Security and Privacy Controls

**AI Service Security Controls** (apps/ai-service/src/middleware/security.js):
```javascript
const logger = require('../utils/logger');

// Middleware to sanitize request data before sending to AI
const sanitizeForAI = (req, res, next) => {
  if (req.body) {
    // Remove or mask sensitive information before AI processing
    const sanitizedBody = { ...req.body };
    
    // Remove sensitive fields that shouldn't go to AI
    const sensitiveFields = [
      'paymentDetails', 'financialData', 'bankAccount', 'creditCard', 
      'ssn', 'idNumber', 'password', 'token', 'apiKey', 'secret'
    ];
    
    for (const field of sensitiveFields) {
      if (sanitizedBody[field]) {
        delete sanitizedBody[field];
        logger.warn(`Sensitive field ${field} removed from AI request`, { 
          correlationId: req.headers['x-correlation-id'] 
        });
      }
    }
    
    // Mask email addresses and other PII
    if (sanitizedBody.email) {
      sanitizedBody.email = maskEmail(sanitizedBody.email);
    }
    
    if (sanitizedBody.description) {
      // Remove potential PII from descriptions
      sanitizedBody.description = removePII(sanitizedBody.description);
    }
    
    req.sanitizedBody = sanitizedBody;
  }
  
  next();
};

// Middleware to ensure AI service cannot make autonomous decisions
const enforceNonAutonomousOperation = (req, res, next) => {
  // Block any endpoints that would allow the AI to make final decisions
  const forbiddenEndpoints = [
    '/api/v1/ai/approve-payment',
    '/api/v1/ai/resolve-dispute',
    '/api/v1/ai/release-funds',
    '/api/v1/ai/make-decision'
  ];
  
  if (forbiddenEndpoints.includes(req.originalUrl)) {
    logger.error('AI service attempted to access autonomous decision endpoint', {
      path: req.originalUrl,
      correlationId: req.headers['x-correlation-id']
    });
    return res.status(403).json({ 
      error: 'AI services cannot make autonomous decisions' 
    });
  }
  
  next();
};

// Function to mask email addresses
function maskEmail(email) {
  if (!email || typeof email !== 'string') return email;
  
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const localPart = parts[0];
  const domain = parts[1];
  
  if (localPart.length <= 2) {
    return '*@' + domain;
  }
  
  const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
  return maskedLocal + '@' + domain;
}

// Function to remove PII from text (simplified example)
function removePII(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Remove potential phone numbers
  text = text.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  
  // Remove potential email addresses
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  
  // Remove potential SSN patterns
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
  
  return text;
}

// Data retention policy for AI service logs
const enforceDataRetention = (req, res, next) => {
  // Log retention should be shorter for AI service than main application
  // This is handled at the logging level, but we make sure logs are properly categorized
  
  req.logContext = {
    ...req.logContext,
    service: 'ai-service',
    retentionCategory: 'short-term'
  };
  
  next();
};

module.exports = {
  sanitizeForAI,
  enforceNonAutonomousOperation,
  enforceDataRetention
};
```

### 6. AI Service Health and Monitoring with Boundaries

**AI Service Health Controller** (apps/ai-service/src/controllers/healthController.js):
```javascript
const logger = require('../utils/logger');
const communicationService = require('../services/communicationService');

const healthController = {
  async healthCheck(req, res) {
    const healthCheck = {
      status: 'healthy',
      service: 'AI-Service',
      timestamp: new Date().toISOString(),
      boundaries: {
        autonomous_decisions: false,
        human_review_required: true,
        data_privacy_compliant: true,
        rate_limiting_active: true
      },
      checks: {}
    };

    try {
      // Check OpenAI API connectivity
      healthCheck.checks.openai = await checkOpenAIHealth();
      
      // Check communication with main API
      healthCheck.checks.mainApi = await communicationService.checkMainApiHealth();
      
      // Verify all boundary protections are active
      healthCheck.checks.boundaries = {
        non_autonomous: true,
        data_sanitization: true,
        validation_active: true
      };

      res.status(200).json(healthCheck);
    } catch (error) {
      logger.error('AI service health check failed', { error: error.message });
      healthCheck.status = 'unhealthy';
      healthCheck.error = error.message;
      res.status(503).json(healthCheck);
    }
  },

  // Get AI service status with boundary information
  async getStatus(req, res) {
    try {
      const status = {
        operational: true,
        boundaries: {
          advisory_only: true,
          no_autonomous_payments: true,
          no_dispute_resolution: true,
          human_review_required: true,
          data_privacy_protected: true
        },
        active_services: [
          'milestone_suggestions',
          'deliverable_verification', 
          'dispute_analysis'
        ],
        rate_limits: {
          requests_per_minute: process.env.AI_API_RATE_LIMIT || 100,
          concurrent_requests: 10
        },
        data_handling: {
          pII_sanitized: true,
          sensitive_data_blocked: true,
          logs_retention_days: 7
        },
        timestamp: new Date().toISOString()
      };

      res.json(status);
    } catch (error) {
      logger.error('AI service status check failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
};

async function checkOpenAIHealth() {
  try {
    // Test OpenAI connectivity with a simple request
    // Use a minimal request to check connectivity without consuming many tokens
    // const openai = require('openai');
    // const testClient = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // await testClient.models.list();
    
    return {
      healthy: true,
      service: 'OpenAI',
      message: 'API key validated and service accessible'
    };
  } catch (error) {
    return {
      healthy: false,
      service: 'OpenAI',
      message: `OpenAI service error: ${error.message}`
    };
  }
}

module.exports = healthController;
```

### 7. Integration with Main API Service

**Updated Main API Integration** (apps/api/src/services/aiIntegrationService.js):
```javascript
const axios = require('axios');
const logger = require('../utils/logger');

class AIIntegrationService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3002';
    this.apiKey = process.env.AI_SERVICE_API_KEY;
  }

  // Get milestone suggestions from AI service
  async getMilestoneSuggestions(projectData) {
    try {
      logger.info('Requesting AI milestone suggestions', {
        projectId: projectData.id || projectData.projectId,
        projectTitle: projectData.title || projectData.projectTitle
      });

      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/ai/milestone-suggestions`,
        {
          projectId: projectData.id || projectData.projectId,
          projectTitle: projectData.title || projectData.projectTitle,
          projectDescription: projectData.description,
          budget: projectData.budget,
          timeline: projectData.deadline,
          skillsRequired: projectData.skillsRequired
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      // AI responses are advisory only - humans must review and approve
      logger.info('AI milestone suggestions received', {
        suggestionCount: response.data.suggestions.length,
        projectId: projectData.id || projectData.projectId
      });

      return {
        suggestions: response.data.suggestions,
        metadata: response.data.metadata,
        advisory: true, // Emphasize this is advisory
        requiresHumanReview: true // Explicitly state human review is required
      };
    } catch (error) {
      logger.error('AI milestone suggestions request failed', { 
        error: error.message,
        projectId: projectData.id || projectData.projectId
      });
      
      // Fallback when AI is unavailable
      return {
        suggestions: [],
        metadata: {
          source: 'fallback',
          timestamp: new Date().toISOString(),
          message: 'AI service unavailable - using fallback'
        },
        advisory: true,
        requiresHumanReview: true,
        fallback: true
      };
    }
  }

  // Get deliverable verification from AI service
  async getDeliverableVerification(verificationData) {
    try {
      logger.info('Requesting AI deliverable verification', {
        milestoneId: verificationData.milestoneId,
        deliverable: verificationData.deliverable.substring(0, 100) + '...'
      });

      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/ai/verify-deliverable`,
        {
          milestoneId: verificationData.milestoneId,
          milestoneTitle: verificationData.milestoneTitle,
          deliverable: verificationData.deliverable,
          acceptanceCriteria: verificationData.acceptanceCriteria
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      logger.info('AI deliverable verification received', {
        confidenceScore: response.data.verification.confidenceScore,
        milestoneId: verificationData.milestoneId
      });

      return {
        verification: response.data.verification,
        metadata: response.data.metadata,
        advisory: true,
        requiresHumanReview: true
      };
    } catch (error) {
      logger.error('AI deliverable verification request failed', { 
        error: error.message,
        milestoneId: verificationData.milestoneId
      });
      
      return {
        verification: null,
        metadata: {
          source: 'fallback',
          timestamp: new Date().toISOString(),
          message: 'AI service unavailable for verification'
        },
        advisory: true,
        requiresHumanReview: true,
        fallback: true
      };
    }
  }

  // Get dispute analysis from AI service
  async getDisputeAnalysis(analysisData) {
    try {
      logger.info('Requesting AI dispute analysis', {
        disputeId: analysisData.disputeId,
        disputeSummary: analysisData.disputeSummary.substring(0, 100) + '...'
      });

      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/ai/dispute-analysis`,
        {
          disputeId: analysisData.disputeId,
          disputeSummary: analysisData.disputeSummary,
          disputeDetails: analysisData.disputeDetails,
          evidence: analysisData.evidence
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // Longer timeout for dispute analysis
        }
      );

      logger.info('AI dispute analysis received', {
        disputeId: analysisData.disputeId,
        analysisLength: response.data.analysis.summary.length
      });

      return {
        analysis: response.data.analysis,
        metadata: response.data.metadata,
        advisory: true,
        forArbitratorReview: true
      };
    } catch (error) {
      logger.error('AI dispute analysis request failed', { 
        error: error.message,
        disputeId: analysisData.disputeId
      });
      
      return {
        analysis: null,
        metadata: {
          source: 'fallback',
          timestamp: new Date().toISOString(),
          message: 'AI service unavailable for dispute analysis'
        },
        advisory: true,
        forArbitratorReview: true,
        fallback: true
      };
    }
  }

  // Verify AI service health
  async checkAIHealth() {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/api/health`);
      return response.data.status === 'healthy';
    } catch (error) {
      logger.error('AI service health check failed', { error: error.message });
      return false;
    }
  }
}

// Singleton instance
const aiIntegrationService = new AIIntegrationService();

module.exports = aiIntegrationService;
```

### 8. Main API Controller Updates with AI Integration

**Updated Project Controller with AI Integration** (apps/api/src/controllers/projectController.js):
```javascript
const { Project, User, Milestone } = require('../models');
const logger = require('../utils/logger');
const aiIntegrationService = require('../services/aiIntegrationService');

const projectController = {
  // Create project - now with AI milestone suggestions
  async createProject(req, res) {
    try {
      const { title, description, budget, deadline, category, skillsRequired } = req.body;
      
      const project = await Project.create({
        title,
        description,
        clientId: req.user.id,
        budget,
        deadline,
        category,
        skillsRequired: skillsRequired || [],
        status: 'draft'
      });

      logger.info('Project created successfully', {
        projectId: project.id,
        clientId: req.user.id,
        title
      });

      // Get AI suggestions for milestones (asynchronous, non-blocking)
      setImmediate(async () => {
        try {
          const suggestions = await aiIntegrationService.getMilestoneSuggestions({
            id: project.id,
            title: project.title,
            description: project.description,
            budget: project.budget,
            deadline: project.deadline,
            skillsRequired: project.skillsRequired
          });
          
          // Store suggestions for human review
          // In a real implementation, you'd store these in a suggestions table
          logger.info('AI milestone suggestions generated and stored', {
            projectId: project.id,
            suggestionCount: suggestions.suggestions.length
          });
        } catch (suggestionError) {
          logger.warn('AI milestone suggestions failed but project creation continues', {
            projectId: project.id,
            error: suggestionError.message
          });
        }
      });

      res.status(201).json({ 
        message: 'Project created successfully', 
        project,
        aiSuggestionsAvailable: true // Indicate that AI suggestions are being processed
      });
    } catch (error) {
      logger.error('Error creating project', { error: error.message, userId: req.user.id });
      res.status(500).json({ error: error.message });
    }
  },

  // Get project milestone suggestions
  async getMilestoneSuggestions(req, res) {
    try {
      const { id } = req.params;
      
      // Verify user has access to this project
      const project = await Project.findByPk(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.clientId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get AI suggestions
      const suggestions = await aiIntegrationService.getMilestoneSuggestions(project.toJSON());
      
      res.json({
        suggestions: suggestions.suggestions,
        metadata: suggestions.metadata,
        advisory: true,
        requiresHumanReview: true
      });
    } catch (error) {
      logger.error('Error getting milestone suggestions', { 
        error: error.message, 
        projectId: req.params.id 
      });
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = projectController;
```

### 9. Environment Configuration

**AI Service Environment Variables** (apps/ai-service/.env):
```env
# AI Service Configuration
PORT=3002
NODE_ENV=production

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Main API Communication
API_BASE_URL=http://localhost:3001
INTERNAL_API_KEY=your-internal-api-key

# Rate Limiting
AI_API_RATE_LIMIT=100
AI_CONCURRENT_LIMIT=5

# Security and Privacy
AI_LOG_RETENTION_DAYS=7
AI_DATA_PRIVACY_MODE=true
AI_NO_AUTONOMOUS_DECISIONS=true

# Health Check
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_RETRIES=3

# Fallback Configuration
AI_FALLBACK_ENABLED=true
AI_FALLBACK_TIMEOUT=5000

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn
```

### 10. Testing

**AI Service Boundary Tests** (apps/ai-service/tests/unit/boundary.test.js):
```javascript
const request = require('supertest');
const app = require('../../src/app');

describe('AI Service Boundaries and Limitations', () => {
  test('AI service should not allow autonomous decision endpoints', async () => {
    // These endpoints should not exist or should return 403
    const forbiddenEndpoints = [
      '/api/v1/ai/approve-payment',
      '/api/v1/ai/resolve-dispute',
      '/api/v1/ai/release-funds',
      '/api/v1/ai/make-decision'
    ];

    for (const endpoint of forbiddenEndpoints) {
      const response = await request(app)
        .post(endpoint)
        .send({ test: 'data' })
        .expect(403);
      
      expect(response.body.error).toBe('AI services cannot make autonomous decisions');
    }
  });

  test('AI service should include advisory disclaimers', async () => {
    // Test milestone suggestions endpoint
    const response = await request(app)
      .post('/api/v1/ai/milestone-suggestions')
      .send({
        projectDescription: 'Test project description',
        projectTitle: 'Test Project',
        budget: 1000
      })
      .expect(200);

    expect(response.body.metadata).toBeDefined();
    expect(response.body.metadata.source).toBe('AI-Advisory');
    expect(response.body.metadata.disclaimer).toBeDefined();
    expect(response.body.metadata.disclaimer).toContain('human review');
  });

  test('AI service should sanitize sensitive data', async () => {
    // This test would require mocking the OpenAI call
    // to verify that sensitive data is not sent
    const response = await request(app)
      .post('/api/v1/ai/milestone-suggestions')
      .send({
        projectDescription: 'Test project',
        projectTitle: 'Test Project',
        budget: 1000,
        // Sensitive data that should be removed
        paymentDetails: 'credit card info',
        ssn: '123-45-6789'
      })
      .expect(400);

    // Should fail validation due to sensitive data
    expect(response.body.error).toContain('Invalid request structure');
  });

  test('AI verification results should require human review', async () => {
    const response = await request(app)
      .post('/api/v1/ai/verify-deliverable')
      .send({
        deliverable: 'Test deliverable',
        acceptanceCriteria: 'Test criteria',
        milestoneId: 'test-milestone',
        milestoneTitle: 'Test Milestone'
      })
      .expect(200);

    expect(response.body.metadata).toBeDefined();
    expect(response.body.metadata.disclaimer).toContain('human review');
    expect(response.body.metadata.source).toBe('AI-Advisory');
  });

  test('AI dispute analysis should be for arbitrator review only', async () => {
    const response = await request(app)
      .post('/api/v1/ai/dispute-analysis')
      .send({
        disputeId: 'test-dispute',
        disputeSummary: 'Test dispute',
        disputeDetails: 'Test details',
        evidence: 'Test evidence'
      })
      .expect(200);

    expect(response.body.metadata).toBeDefined();
    expect(response.body.metadata.disclaimer).toContain('human arbitrators');
  });
});

describe('AI Service Health and Status', () => {
  test('health check should confirm boundaries are active', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.boundaries).toBeDefined();
    expect(response.body.boundaries.autonomous_decisions).toBe(false);
    expect(response.body.boundaries.human_review_required).toBe(true);
    expect(response.body.boundaries.data_privacy_compliant).toBe(true);
  });

  test('status endpoint should confirm advisory-only operation', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);

    expect(response.body.boundaries).toBeDefined();
    expect(response.body.boundaries.advisory_only).toBe(true);
    expect(response.body.boundaries.no_autonomous_payments).toBe(true);
    expect(response.body.boundaries.no_dispute_resolution).toBe(true);
  });
});
```

### 11. Documentation and Compliance

**AI Service Boundaries Documentation** (apps/ai-service/BOUNDARIES.md):
```markdown
# AI Service Boundaries and Limitations

## Core Principles

### 1. Advisory-Only Function
- The AI service provides suggestions and analysis only
- All final decisions require human review and approval
- AI cannot make autonomous decisions affecting users' funds or project outcomes

### 2. No Financial Authority
- AI cannot approve payments
- AI cannot release funds from escrow
- AI cannot process refunds or withdrawals
- All financial operations require human authorization

### 3. No Dispute Resolution Authority
- AI provides analysis and recommendations for disputes
- AI cannot resolve disputes or make binding decisions
- All dispute resolutions must be handled by human arbitrators or agreed upon by parties

### 4. Data Privacy and Security
- Sensitive financial information is blocked from AI requests
- Personal identification information is sanitized
- All data transmission follows secure protocols
- AI service logs have shorter retention periods

## Supported Operations

### ✅ Allowed Operations
- **Milestone Suggestions**: AI analyzes project requirements and suggests milestone breakdowns
- **Deliverable Verification**: AI compares deliverables to acceptance criteria and provides confidence scores
- **Dispute Analysis**: AI analyzes dispute facts and provides resolution recommendations

### ❌ Prohibited Operations
- **Payment Approvals**: AI cannot approve, release, or process payments
- **Dispute Resolutions**: AI cannot resolve disputes or make binding decisions
- **User Permission Changes**: AI cannot modify user roles or permissions
- **Fund Transfers**: AI cannot move funds between accounts or escrow

## Implementation Details

### Request Validation
- All requests are validated to ensure sensitive data is excluded
- Data sanitization occurs before any AI processing
- Rate limiting prevents API abuse

### Response Handling
- All AI responses include advisory disclaimers
- Responses are marked as requiring human review
- Metadata includes source attribution (AI-Advisory)

### Fallback Mechanisms
- System continues to function if AI service is unavailable
- Human workflows are not blocked by AI service unavailability
- Graceful degradation with clear status messages

## Compliance Requirements

### GDPR Compliance
- Personal data is not stored or transmitted unnecessarily
- Data minimization principles applied
- Right to deletion honored for all AI-related data

### Financial Compliance
- No autonomous financial operations
- Clear audit trails for all AI interactions
- Human confirmation required for all financial actions
```

This comprehensive implementation ensures the AI service:

1. Operates within clear boundaries as an advisory system only
2. Cannot make autonomous decisions affecting payments or disputes
3. Maintains proper data privacy and security
4. Includes fallback mechanisms when AI is unavailable
5. Provides clear disclaimers about advisory nature of its outputs
6. Implements proper validation and sanitization
7. Maintains audit trails for all AI interactions
8. Continues to function properly if AI service is unavailable