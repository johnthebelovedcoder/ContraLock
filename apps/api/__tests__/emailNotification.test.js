const nodemailer = require('nodemailer');
const EmailService = require('../src/services/email/emailService');
const NotificationService = require('../src/services/email/notificationService');
const EnhancedNotificationService = require('../src/services/email/enhancedNotificationService');

// Mock the nodemailer transporter
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id', response: 'ok' })
  }))
}));

describe('Email Notification System', () => {
  let emailService;
  let notificationService;
  let enhancedNotificationService;

  beforeEach(() => {
    emailService = new EmailService();
    notificationService = new (require('../src/services/email/notificationService')).constructor();
    enhancedNotificationService = EnhancedNotificationService;
  });

  describe('EmailService', () => {
    test('should validate email addresses correctly', () => {
      expect(emailService.isValidEmail('test@example.com')).toBe(true);
      expect(emailService.isValidEmail('invalid-email')).toBe(false);
      expect(emailService.isValidEmail('')).toBe(false);
      expect(emailService.isValidEmail('test@')).toBe(false);
      expect(emailService.isValidEmail('@example.com')).toBe(false);
    });

    test('should send email successfully', async () => {
      const sendMailSpy = jest.spyOn(emailService.transporter, 'sendMail');
      
      const result = await emailService.sendEmail('test@example.com', 'Test Subject', '<p>Test HTML</p>');
      
      expect(sendMailSpy).toHaveBeenCalled();
      expect(result.messageId).toBe('test-message-id');
    });

    test('should throw error for invalid email address', async () => {
      await expect(emailService.sendEmail('invalid-email', 'Test Subject', '<p>Test HTML</p>'))
        .rejects
        .toThrow('Invalid email address: invalid-email');
    });

    test('should send verification email with proper template', async () => {
      const sendMailSpy = jest.spyOn(emailService.transporter, 'sendMail');
      
      const user = { 
        _id: 'user123', 
        email: 'test@example.com', 
        firstName: 'John',
        lastName: 'Doe'
      };
      const token = 'verification-token-123';
      
      await emailService.sendVerificationEmail(user, token);
      
      expect(sendMailSpy).toHaveBeenCalled();
      const callArgs = sendMailSpy.mock.calls[0][0];
      expect(callArgs.to).toBe('test@example.com');
      expect(callArgs.subject).toBe('Verify Your Email Address');
      expect(callArgs.html).toContain('John');
      expect(callArgs.html).toContain('verification-token-123');
    });

    test('should send welcome email with proper template', async () => {
      const sendMailSpy = jest.spyOn(emailService.transporter, 'sendMail');
      
      const user = { 
        _id: 'user123', 
        email: 'test@example.com', 
        firstName: 'John',
        lastName: 'Doe'
      };
      
      await emailService.sendWelcomeEmail(user);
      
      expect(sendMailSpy).toHaveBeenCalled();
      const callArgs = sendMailSpy.mock.calls[0][0];
      expect(callArgs.to).toBe('test@example.com');
      expect(callArgs.subject).toBe('Welcome to ContraLock!');
      expect(callArgs.html).toContain('John');
    });
  });

  describe('NotificationService', () => {
    test('should send verification notification', async () => {
      const sendSpy = jest.spyOn(EnhancedNotificationService, 'sendNotification');
      
      const user = { 
        _id: 'user123', 
        email: 'test@example.com', 
        firstName: 'John',
        lastName: 'Doe'
      };
      const token = 'verification-token-123';
      
      await notificationService.sendVerificationEmail(user, token);
      
      expect(sendSpy).toHaveBeenCalledWith('USER_VERIFICATION', { user, token });
    });

    test('should send welcome notification', async () => {
      const sendSpy = jest.spyOn(EnhancedNotificationService, 'sendNotification');
      
      const user = { 
        _id: 'user123', 
        email: 'test@example.com', 
        firstName: 'John',
        lastName: 'Doe'
      };
      
      await notificationService.sendWelcomeEmail(user);
      
      expect(sendSpy).toHaveBeenCalledWith('USER_WELCOME', { user });
    });

    test('should send payment confirmation notification', async () => {
      const sendSpy = jest.spyOn(EnhancedNotificationService, 'sendNotification');
      
      const client = { 
        _id: 'user123', 
        email: 'client@example.com', 
        firstName: 'Jane',
        lastName: 'Client'
      };
      const project = { 
        _id: 'project123',
        title: 'Test Project',
        description: 'Test description'
      };
      
      await notificationService.sendPaymentConfirmation(client, project, 1000, 'txn123');
      
      expect(sendSpy).toHaveBeenCalledWith('PAYMENT_CONFIRMATION', { 
        client, 
        project, 
        amount: 1000, 
        transactionId: 'txn123' 
      });
    });

    test('should handle milestone status updates properly', async () => {
      const sendSpy = jest.spyOn(EnhancedNotificationService, 'sendNotification');
      
      const recipient = { 
        _id: 'user123', 
        email: 'recipient@example.com', 
        firstName: 'Recipient',
        lastName: 'User'
      };
      const project = { 
        _id: 'project123',
        title: 'Test Project',
        description: 'Test description'
      };
      const milestone = {
        _id: 'milestone123',
        title: 'Test Milestone',
        description: 'Test milestone description',
        amount: 10000 // in cents
      };
      
      await notificationService.sendMilestoneUpdateNotification(recipient, project, milestone, 'SUBMITTED', 'Submission ready for review');
      
      expect(sendSpy).toHaveBeenCalledWith('MILESTONE_SUBMITTED', { 
        recipient, 
        project, 
        milestone, 
        message: 'Submission ready for review'
      });
    });

    test('should handle generic notification events', async () => {
      const sendSpy = jest.spyOn(EnhancedNotificationService, 'sendNotification');
      
      const eventData = {
        user: { 
          _id: 'user123', 
          email: 'test@example.com', 
          firstName: 'John'
        },
        project: { 
          _id: 'project123',
          title: 'Test Project'
        }
      };
      
      await notificationService.sendNotification('USER_WELCOME', eventData);
      
      expect(sendSpy).toHaveBeenCalledWith('USER_WELCOME', eventData);
    });
  });

  describe('EnhancedNotificationService', () => {
    test('should handle all notification types', async () => {
      const notificationTypes = [
        'USER_VERIFICATION',
        'USER_WELCOME',
        'PAYMENT_CONFIRMATION',
        'PAYMENT_RELEASE',
        'MILESTONE_SUBMITTED',
        'MILESTONE_APPROVED',
        'MILESTONE_REJECTED',
        'MILESTONE_REVISION_REQUESTED',
        'PROJECT_INVITATION',
        'DISPUTE_INITIATED',
        'DISPUTE_RESOLVED',
        'PROJECT_COMPLETED',
        'REFUND_ISSUED',
        'MESSAGE_RECEIVED',
        'PROJECT_STATUS_UPDATE',
        'DEADLINE_REMINDER',
        'ACCOUNT_SUSPENDED',
        'ACCOUNT_REACTIVATED',
        'PAYMENT_FAILED',
        'WITHDRAWAL_PROCESSED',
        'KYC_APPROVED',
        'KYC_REJECTED',
        'AUTO_APPROVAL_WARNING',
        'INVOICE_GENERATED'
      ];

      for (const eventType of notificationTypes) {
        // Test that the event type exists in the handlers
        expect(enhancedNotificationService.eventHandlers[eventType]).toBeDefined();
      }
    });

    test('should throw error for unknown event type', async () => {
      await expect(enhancedNotificationService.sendNotification('UNKNOWN_EVENT', {}))
        .rejects
        .toThrow('Unknown event type: UNKNOWN_EVENT');
    });

    test('should send milestone submission notification', async () => {
      const sendMailSpy = jest.spyOn(emailService.transporter, 'sendMail');
      
      const data = {
        recipient: { 
          _id: 'user123', 
          email: 'recipient@example.com', 
          firstName: 'Recipient'
        },
        project: { 
          _id: 'project123',
          title: 'Test Project',
          description: 'Test description'
        },
        milestone: {
          _id: 'milestone123',
          title: 'Test Milestone',
          description: 'Test milestone description',
          amount: 10000 // in cents
        }
      };
      
      await enhancedNotificationService.sendMilestoneSubmittedNotification(data);
      
      expect(sendMailSpy).toHaveBeenCalled();
      const callArgs = sendMailSpy.mock.calls[0][0];
      expect(callArgs.to).toBe('recipient@example.com');
      expect(callArgs.subject).toBe('New Milestone Submission: Test Project');
      expect(callArgs.html).toContain('Test Milestone');
    });

    test('should send dispute initiated notification', async () => {
      const sendMailSpy = jest.spyOn(emailService.transporter, 'sendMail');
      
      const data = {
        recipient: { 
          _id: 'user123', 
          email: 'recipient@example.com', 
          firstName: 'Recipient'
        },
        project: { 
          _id: 'project123',
          title: 'Test Project',
          description: 'Test description'
        },
        milestone: {
          _id: 'milestone123',
          title: 'Test Milestone',
          description: 'Test milestone description',
          amount: 10000 // in cents
        },
        reason: 'Quality concerns'
      };
      
      await enhancedNotificationService.sendDisputeInitiatedNotification(data);
      
      expect(sendMailSpy).toHaveBeenCalled();
      const callArgs = sendMailSpy.mock.calls[0][0];
      expect(callArgs.to).toBe('recipient@example.com');
      expect(callArgs.subject).toBe('DISPUTE INITIATED: Test Project');
      expect(callArgs.html).toContain('Quality concerns');
    });
  });

  describe('Integration Tests', () => {
    test('should process a complete notification workflow', async () => {
      const sendMailSpy = jest.spyOn(emailService.transporter, 'sendMail');
      
      // Simulate a complete user journey
      const user = { 
        _id: 'user123', 
        email: 'client@example.com', 
        firstName: 'John',
        lastName: 'Client'
      };
      
      const project = { 
        _id: 'project123',
        title: 'Website Development',
        description: 'Website development project',
        budget: 50000 // in cents
      };
      
      const milestone = {
        _id: 'milestone123',
        title: 'Initial Design',
        description: 'Design mockups for the website',
        amount: 10000, // in cents
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };
      
      // Send welcome email
      await enhancedNotificationService.sendNotification('USER_WELCOME', { user });
      expect(sendMailSpy).toHaveBeenCalledTimes(1);
      
      // Send project invitation
      await enhancedNotificationService.sendNotification('PROJECT_INVITATION', { 
        freelancer: { ...user, email: 'freelancer@example.com', firstName: 'Jane' }, 
        client: user, 
        project 
      });
      expect(sendMailSpy).toHaveBeenCalledTimes(2);
      
      // Send milestone submission
      await enhancedNotificationService.sendNotification('MILESTONE_SUBMITTED', { 
        recipient: user, 
        project, 
        milestone 
      });
      expect(sendMailSpy).toHaveBeenCalledTimes(3);
      
      // Send milestone approval
      await enhancedNotificationService.sendNotification('MILESTONE_APPROVED', { 
        recipient: { ...user, email: 'freelancer@example.com', firstName: 'Jane' }, 
        project, 
        milestone 
      });
      expect(sendMailSpy).toHaveBeenCalledTimes(4);
      
      // Send payment release
      await enhancedNotificationService.sendNotification('PAYMENT_RELEASE', { 
        freelancer: { ...user, email: 'freelancer@example.com', firstName: 'Jane' }, 
        project, 
        milestone, 
        amount: 9750 // amount after fees
      });
      expect(sendMailSpy).toHaveBeenCalledTimes(5);
    });
  });
});