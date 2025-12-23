const EnhancedEmailService = require('./enhancedEmailService');
const logger = require('../../utils/logger');

class EnhancedNotificationService {
  constructor() {
    this.emailService = EnhancedEmailService;
  }

  async sendNotification(notificationType, data) {
    try {
      let result;

      switch(notificationType) {
        case 'PAYMENT_CONFIRMATION':
          result = await this.sendPaymentConfirmation(data);
          break;
        case 'PAYMENT_RELEASE':
          result = await this.sendPaymentRelease(data);
          break;
        case 'MILESTONE_SUBMITTED':
          result = await this.sendMilestoneSubmitted(data);
          break;
        case 'MILESTONE_APPROVED':
          result = await this.sendMilestoneApproved(data);
          break;
        case 'MILESTONE_REVISION_REQUESTED':
          result = await this.sendMilestoneRevisionRequested(data);
          break;
        case 'DISPUTE_RAISED':
          result = await this.sendDisputeRaised(data);
          break;
        case 'DISPUTE_RESOLVED':
          result = await this.sendDisputeResolved(data);
          break;
        case 'PROJECT_INVITE':
          result = await this.sendProjectInvite(data);
          break;
        case 'AUTO_APPROVAL_WARNING':
          result = await this.sendAutoApprovalWarning(data);
          break;
        case 'MILESTONE_AUTO_APPROVED':
          result = await this.sendMilestoneAutoApproved(data);
          break;
        case 'VERIFICATION_EMAIL':
          result = await this.sendVerificationEmail(data);
          break;
        case 'WELCOME_EMAIL':
          result = await this.sendWelcomeEmail(data);
          break;
        case 'PAYMENT_RELEASE_NOTIFICATION':
          result = await this.sendPaymentReleaseNotification(data);
          break;
        case 'MILESTONE_UPDATE':
          result = await this.sendMilestoneUpdate(data);
          break;
        case 'DISPUTE_RESOLUTION':
          result = await this.sendDisputeResolution(data);
          break;
        case 'PROJECT_INVITATION':
          result = await this.sendProjectInvitation(data);
          break;
        default:
          throw new Error(`Unknown notification type: ${notificationType}`);
      }

      logger.info('Notification sent successfully', {
        notificationType,
        recipients: this.getRecipients(notificationType, data),
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      logger.error('Error sending notification', {
        notificationType,
        error: error.message,
        data: JSON.stringify(data, null, 2)
      });
      throw error;
    }
  }

  // Helper to get recipients for logging
  getRecipients(notificationType, data) {
    switch(notificationType) {
      case 'PAYMENT_CONFIRMATION':
        return [data.client.email];
      case 'PAYMENT_RELEASE':
        return [data.freelancer.email];
      case 'MILESTONE_SUBMITTED':
        return [data.client.email];
      case 'MILESTONE_APPROVED':
        return [data.freelancer.email];
      case 'MILESTONE_REVISION_REQUESTED':
        return [data.freelancer.email];
      case 'DISPUTE_RAISED':
        return [data.project.client.email, data.project.freelancer.email];
      case 'DISPUTE_RESOLVED':
        return [data.project.client.email, data.project.freelancer.email];
      case 'PROJECT_INVITE':
        return [data.invitedEmail];
      case 'AUTO_APPROVAL_WARNING':
        return [data.client.email];
      case 'MILESTONE_AUTO_APPROVED':
        return [data.freelancer.email];
      case 'VERIFICATION_EMAIL':
        return [data.user.email];
      case 'WELCOME_EMAIL':
        return [data.user.email];
      case 'PAYMENT_RELEASE_NOTIFICATION':
        return [data.freelancer.email];
      case 'MILESTONE_UPDATE':
        return [data.user.email];
      case 'DISPUTE_RESOLUTION':
        return [data.user.email];
      case 'PROJECT_INVITATION':
        return [data.freelancer.email];
      default:
        return [];
    }
  }

  async sendPaymentConfirmation(data) {
    const { client, project, amount, transactionId } = data;
    return await this.emailService.sendPaymentConfirmation(client, project, amount, transactionId);
  }

  async sendPaymentRelease(data) {
    const { freelancer, project, milestone, amount } = data;
    return await this.emailService.sendPaymentReleaseNotification(freelancer, project, milestone, amount);
  }

  async sendMilestoneSubmitted(data) {
    const { client, project, milestone } = data;
    return await this.emailService.sendMilestoneUpdate(client, project, milestone, 'SUBMITTED', 'Milestone has been submitted for review');
  }

  async sendMilestoneApproved(data) {
    const { freelancer, project, milestone, amount } = data;
    return await this.emailService.sendMilestoneUpdate(freelancer, project, milestone, 'APPROVED', 'Milestone has been approved by client');
  }

  async sendMilestoneRevisionRequested(data) {
    const { freelancer, project, milestone, revisionNotes } = data;
    return await this.emailService.sendMilestoneUpdate(freelancer, project, milestone, 'REVISION_REQUESTED', revisionNotes);
  }

  async sendDisputeRaised(data) {
    const { project, milestone, dispute } = data;
    const message = `A dispute has been raised: ${dispute.reason}`;
    
    // Send to both parties
    const promises = [
      this.emailService.sendMilestoneUpdate(project.client, project, milestone, 'DISPUTED', message),
      this.emailService.sendMilestoneUpdate(project.freelancer, project, milestone, 'DISPUTED', message)
    ];
    
    return await Promise.all(promises);
  }

  async sendDisputeResolved(data) {
    const { project, milestone, dispute, decision } = data;
    const message = `Dispute resolved: ${decision}`;
    
    // Send to both parties
    const promises = [
      this.emailService.sendDisputeResolution(project.client, project, dispute, { decision }),
      this.emailService.sendDisputeResolution(project.freelancer, project, dispute, { decision })
    ];
    
    return await Promise.all(promises);
  }

  async sendProjectInvite(data) {
    const { freelancer, client, project } = data;
    return await this.emailService.sendProjectInvitation(freelancer, client, project);
  }

  async sendAutoApprovalWarning(data) {
    const { client, project, milestone, daysRemaining } = data;
    const message = `Milestone will be auto-approved in ${daysRemaining} days if no action is taken`;
    return await this.emailService.sendMilestoneUpdate(client, project, milestone, 'AUTO_APPROVAL_WARNING', message);
  }

  async sendMilestoneAutoApproved(data) {
    const { freelancer, project, milestone, amount } = data;
    return await this.emailService.sendMilestoneUpdate(freelancer, project, milestone, 'AUTO_APPROVED', 'Milestone auto-approved');
  }

  async sendVerificationEmail(data) {
    const { user, token } = data;
    return await this.emailService.sendVerificationEmail(user, token);
  }

  async sendWelcomeEmail(data) {
    const { user } = data;
    return await this.emailService.sendWelcomeEmail(user);
  }

  async sendPaymentReleaseNotification(data) {
    const { freelancer, project, milestone, amount } = data;
    return await this.emailService.sendPaymentReleaseNotification(freelancer, project, milestone, amount);
  }

  async sendMilestoneUpdate(data) {
    const { user, project, milestone, status, message } = data;
    return await this.emailService.sendMilestoneUpdate(user, project, milestone, status, message);
  }

  async sendDisputeResolution(data) {
    const { user, project, dispute, resolution } = data;
    return await this.emailService.sendDisputeResolution(user, project, dispute, resolution);
  }

  async sendProjectInvitation(data) {
    const { freelancer, client, project } = data;
    return await this.emailService.sendProjectInvitation(freelancer, client, project);
  }

  // Send notification with priority
  async sendPriorityNotification(notificationType, data) {
    // For now, we'll just send it normally, but in the future we could implement priority queues
    return await this.sendNotification(notificationType, data);
  }

  // Send batch notifications
  async sendBatchNotifications(notificationType, dataList) {
    const results = [];
    const errors = [];

    for (const data of dataList) {
      try {
        const result = await this.sendNotification(notificationType, data);
        results.push({ data, success: true, result });
      } catch (error) {
        errors.push({ data, success: false, error: error.message });
      }
    }

    return { results, errors, successCount: results.length, errorCount: errors.length };
  }

  // Queue notification for later
  queueNotification(notificationType, data, delay = 0) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await this.sendNotification(notificationType, data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  // Verify email configuration
  async verifyEmailConfiguration() {
    try {
      return await this.emailService.verifyConnection();
    } catch (error) {
      logger.error('Email configuration verification failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new EnhancedNotificationService();