const nodemailer = require('nodemailer');
const hbs = require('handlebars');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

// Import the email queue
const emailQueue = require('../../queues/emailQueue');

class EnhancedEmailService {
  constructor() {
    // Create transporter based on environment
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Production configuration with better connection management
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true' || false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        // Connection pool settings
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 2 * 60 * 1000, // 2 minutes
        rateLimit: 5, // max 5 messages per rateDelta
        // Timeout settings
        socketTimeout: 30000, // 30 seconds
        greetingTimeout: 10000, // 10 seconds
      });
    } else {
      // Development/test configuration using ethereal.email
      console.warn('Using test email service. Please configure EMAIL_* environment variables for production.');
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER || 'test@example.com',
          pass: process.env.EMAIL_PASS || 'testpassword'
        },
        pool: true,
        maxConnections: 2,
      });
    }

    // Initialize templates
    this.templates = this.loadTemplates();
    
    // Set up rate limiting
    this.emailRateLimiter = new Map();
    
    // Set up retry mechanism
    this.maxRetries = parseInt(process.env.EMAIL_MAX_RETRIES) || 3;
    this.retryDelay = parseInt(process.env.EMAIL_RETRY_DELAY) || 1000; // 1 second
  }

  // Load email templates from a directory
  loadTemplates() {
    const templates = {};
    try {
      const templateDir = path.join(__dirname, 'templates');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
      }
      
      // Load common templates
      const templateFiles = fs.readdirSync(templateDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          const templateContent = fs.readFileSync(path.join(templateDir, file), 'utf8');
          templates[templateName] = hbs.compile(templateContent);
        }
      }
    } catch (error) {
      console.error('Error loading email templates:', error.message);
      logger.error('Error loading email templates', { error: error.message });
    }
    
    return templates;
  }

  // Create and register helper functions for templates
  registerTemplateHelpers() {
    // Format currency helper
    hbs.registerHelper('formatCurrency', (amount) => {
      return `$${parseFloat(amount).toFixed(2)}`;
    });

    // Format date helper
    hbs.registerHelper('formatDate', (date) => {
      return new Date(date).toLocaleDateString();
    });

    // Safe string helper
    hbs.registerHelper('safeString', (str) => {
      return new hbs.SafeString(str);
    });

    // Conditional helper
    hbs.registerHelper('ifCond', function (v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });

    // Math division helper (for converting cents to dollars)
    hbs.registerHelper('divide', function (a, b) {
      return parseFloat(a) / parseFloat(b);
    });

    // Current date helper
    hbs.registerHelper('date', function () {
      return new Date();
    });
  }

  // Validate email addresses with more thorough validation
  isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    // Additional checks
    if (email.length > 254) return false; // RFC 5321 limit
    if (email.startsWith('.') || email.endsWith('.')) return false; // Cannot start or end with dot
    
    return emailRegex.test(email);
  }

  // Rate limiting for emails
  async checkRateLimit(email) {
    const now = Date.now();
    const emailKey = email.toLowerCase();
    const emailRate = this.emailRateLimiter.get(emailKey) || { count: 0, lastReset: now };
    
    // Reset counter every 10 minutes
    if (now - emailRate.lastReset > 10 * 60 * 1000) {
      emailRate.count = 0;
      emailRate.lastReset = now;
    }
    
    // Limit to 10 emails per 10 minutes per email
    if (emailRate.count >= 10) {
      logger.warn('Email rate limit exceeded', { email });
      throw new Error(`Rate limit exceeded for ${email}`);
    }
    
    emailRate.count++;
    this.emailRateLimiter.set(emailKey, emailRate);
    
    return true;
  }

  // Send email with retry logic and enhanced error handling
  async sendEmail(to, subject, templateName, templateData = {}, text = null) {
    // For better performance in production, use the queue system by default
    if (process.env.USE_EMAIL_QUEUE !== 'false') {
      // Add to email queue and return immediately
      try {
        const job = await emailQueue.sendEmail(to, subject, templateName, templateData, text);

        logger.info('Email job queued successfully', {
          jobId: job.id,
          to,
          subject,
          template: templateName
        });

        // Return a mock result object to maintain compatibility
        return {
          messageId: `queued-${job.id}`,
          accepted: [to],
          rejected: [],
          response: 'Queued for delivery',
          queueJobId: job.id
        };
      } catch (queueError) {
        logger.error('Failed to queue email, falling back to direct send', {
          error: queueError.message,
          to,
          subject
        });

        // Fall back to direct email sending if queue fails
        return await this.sendEmailDirectly(to, subject, templateName, templateData, text);
      }
    } else {
      // Direct email sending (original behavior)
      return await this.sendEmailDirectly(to, subject, templateName, templateData, text);
    }
  }

  // Original email sending logic as a separate method for fallback
  async sendEmailDirectly(to, subject, templateName, templateData = {}, text = null) {
    try {
      // Validate inputs
      if (!this.isValidEmail(to)) {
        throw new Error(`Invalid email address: ${to}`);
      }

      if (!templateName) {
        throw new Error('Template name is required');
      }

      // Check rate limit
      await this.checkRateLimit(to);

      // Compile template if available
      let html = '';
      if (this.templates[templateName]) {
        html = this.templates[templateName](templateData);
      } else {
        // Fallback to direct HTML
        html = templateData.html || '';
      }

      // Prepare mail options
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'ContraLock',
          address: process.env.EMAIL_FROM || 'noreply@contralock.com'
        },
        to,
        subject,
        html,
        ...(text && { text }),
        // Add headers for better deliverability
        headers: {
          'X-Mailer': 'ContraLock/1.0',
          'X-Priority': 3,
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'List-Unsubscribe': `<${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/preferences>`,
          'Precedence': 'bulk'
        },
        // Add tracking if enabled
        ...(process.env.EMAIL_TRACKING && {
          attachments: [{
            filename: 'tracking-pixel.png',
            content: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
            cid: 'tracking-pixel'
          }]
        })
      };

      // Send email with retry logic
      const result = await this.sendWithRetry(mailOptions);

      logger.info('Email sent successfully', {
        messageId: result.messageId,
        to,
        subject,
        template: templateName
      });

      return result;
    } catch (error) {
      logger.error('Email sending failed', {
        to,
        subject,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Send email with retry logic
  async sendWithRetry(mailOptions, retries = 0) {
    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      if (retries < this.maxRetries) {
        logger.warn(`Email failed, retrying (${retries + 1}/${this.maxRetries})`, {
          error: error.message,
          to: mailOptions.to
        });
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return await this.sendWithRetry(mailOptions, retries + 1);
      } else {
        logger.error('Email failed after max retries', {
          error: error.message,
          to: mailOptions.to,
          retries
        });
        throw error;
      }
    }
  }

  // Verify email configuration and connection
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email transporter configuration verified');
      return true;
    } catch (error) {
      logger.error('Email transporter configuration failed', { error: error.message });
      throw error;
    }
  }

  // Send verification email using enhanced template
  async sendVerificationEmail(user, token) {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
    const unsubscribeLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/unsubscribe?email=${encodeURIComponent(user.email)}`;
    
    const templateData = {
      user: user,
      verificationLink,
      unsubscribeLink,
      siteName: 'ContraLock',
      year: new Date().getFullYear()
    };

    return await this.sendEmail(
      user.email,
      'Verify Your Email Address',
      'verification', // Use 'verification' template
      templateData
    );
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    const templateData = {
      user: user,
      dashboardLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      helpLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/help`,
      siteName: 'ContraLock',
      year: new Date().getFullYear()
    };

    return await this.sendEmail(
      user.email,
      'Welcome to ContraLock!',
      'welcome',
      templateData
    );
  }

  // Send payment confirmation email
  async sendPaymentConfirmation(user, project, amount, transactionId) {
    const templateData = {
      user: user,
      project: project,
      amount: amount,
      transactionId: transactionId,
      dashboardLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      siteName: 'ContraLock',
      year: new Date().getFullYear()
    };

    return await this.sendEmail(
      user.email,
      `Payment Confirmation for ${project.title}`,
      'payment-confirmation',
      templateData
    );
  }

  // Send milestone update email
  async sendMilestoneUpdate(user, project, milestone, status, message = '') {
    let statusText = '';
    let statusColor = '';
    let templateName = 'milestone-update';

    switch(status) {
      case 'SUBMITTED':
        statusText = 'Submitted for Review';
        statusColor = '#fbbf24';
        templateName = 'milestone-submitted';
        break;
      case 'APPROVED':
        statusText = 'Approved';
        statusColor = '#10b981';
        templateName = 'milestone-approved';
        break;
      case 'REVISION_REQUESTED':
        statusText = 'Revision Requested';
        statusColor = '#f97316';
        templateName = 'milestone-revision';
        break;
      case 'DISPUTED':
        statusText = 'Disputed';
        statusColor = '#ef4444';
        templateName = 'milestone-disputed';
        break;
      default:
        statusText = status;
        statusColor = '#6b7280';
    }

    const templateData = {
      user: user,
      project: project,
      milestone: milestone,
      status: statusText,
      statusColor: statusColor,
      message: message,
      dashboardLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/projects/${project._id}`,
      siteName: 'ContraLock',
      year: new Date().getFullYear()
    };

    return await this.sendEmail(
      user.email,
      `Milestone Update for ${project.title}`,
      templateName,
      templateData
    );
  }

  // Send dispute resolution email
  async sendDisputeResolution(user, project, dispute, resolution) {
    const templateData = {
      user: user,
      project: project,
      dispute: dispute,
      resolution: resolution,
      dashboardLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/disputes/${dispute._id}`,
      siteName: 'ContraLock',
      year: new Date().getFullYear()
    };

    return await this.sendEmail(
      user.email,
      `Dispute Resolution: ${project.title}`,
      'dispute-resolution',
      templateData
    );
  }

  // Send project invitation email
  async sendProjectInvitation(freelancer, client, project) {
    const templateData = {
      freelancer: freelancer,
      client: client,
      project: project,
      acceptLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations?project=${project._id}`,
      siteName: 'ContraLock',
      year: new Date().getFullYear()
    };

    return await this.sendEmail(
      freelancer.email,
      `Project Invitation: ${project.title}`,
      'project-invitation',
      templateData
    );
  }

  // Send payment release notification
  async sendPaymentReleaseNotification(freelancer, project, milestone, amount) {
    const templateData = {
      freelancer: freelancer,
      project: project,
      milestone: milestone,
      amount: amount,
      dashboardLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      siteName: 'ContraLock',
      year: new Date().getFullYear()
    };

    return await this.sendEmail(
      freelancer.email,
      `Payment Released: ${project.title}`,
      'payment-release',
      templateData
    );
  }

  // Batch send emails efficiently
  async sendBatchEmails(emails, subject, templateName, templateData) {
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error('Emails array is required and cannot be empty');
    }

    const results = [];
    const errors = [];

    for (const email of emails) {
      try {
        const result = await this.sendEmail(email, subject, templateName, templateData);
        results.push({ email, success: true, result });
      } catch (error) {
        errors.push({ email, success: false, error: error.message });
        logger.error('Batch email failed', { email, error: error.message });
      }
    }

    return { results, errors, successCount: results.length, errorCount: errors.length };
  }

  // Send email with priority
  async sendPriorityEmail(to, subject, templateName, templateData) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@contralock.com',
      to,
      subject,
      priority: 'high',
      html: this.templates[templateName] ? this.templates[templateName](templateData) : templateData.html || '',
      headers: {
        'X-Priority': 1,
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // Queue email for later sending (for non-urgent emails)
  queueEmail(to, subject, templateName, templateData, delay = 0) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await this.sendEmail(to, subject, templateName, templateData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  // Close transporter connection
  async close() {
    try {
      if (this.transporter) {
        await this.transporter.close();
        logger.info('Email transporter closed');
      }
    } catch (error) {
      logger.error('Error closing email transporter', { error: error.message });
    }
  }
}

// Initialize and export the enhanced email service
const enhancedEmailService = new EnhancedEmailService();
enhancedEmailService.registerTemplateHelpers();

module.exports = enhancedEmailService;
module.exports.EnhancedEmailService = EnhancedEmailService; // Export class for queue system