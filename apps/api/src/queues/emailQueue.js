// Email queue for processing email jobs
const { queueService } = require('./index');
const emailService = require('../services/email/enhancedEmailService'); // Import the service instance

class EmailQueue {
  constructor() {
    this.emailQueue = queueService.createQueue('email');
    this.emailService = emailService; // Use the imported service instance

    // Start processing email jobs
    queueService.processQueue('email', this.processEmail.bind(this), 5); // 5 concurrent email processors
  }

  // Process email job
  async processEmail(jobData) {
    const { to, subject, templateName, templateData, text } = jobData;
    
    return await this.emailService.sendEmail(to, subject, templateName, templateData, text);
  }

  // Add an email job to the queue
  async sendEmail(to, subject, templateName, templateData, text = null) {
    const jobData = { to, subject, templateName, templateData, text };
    
    return await queueService.addJob('email', 'send-email', jobData, {
      priority: 'normal',
      removeOnComplete: true,
      removeOnFail: { age: 24 * 3600 }, // Remove after 24 hours
    });
  }

  // Send priority email
  async sendPriorityEmail(to, subject, templateName, templateData, text = null) {
    const jobData = { to, subject, templateName, templateData, text };
    
    return await queueService.addJob('email', 'send-priority-email', jobData, {
      priority: 'high',
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  // Send batch emails
  async sendBatchEmails(emails, subject, templateName, templateData) {
    const promises = emails.map(to => 
      this.sendEmail(to, subject, templateName, templateData)
    );
    
    return await Promise.all(promises);
  }
}

module.exports = new EmailQueue();