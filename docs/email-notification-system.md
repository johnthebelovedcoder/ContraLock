# ContraLock Email Notification System

## Overview

The ContraLock Email Notification System provides comprehensive transactional and alert email capabilities for the platform. It supports various notification types with professionally designed HTML templates to ensure a consistent and trustworthy user experience.

## Architecture

The system consists of three main components:

1. **EmailService**: Core email sending functionality using nodemailer
2. **EnhancedNotificationService**: Comprehensive notification system with 24+ notification types
3. **NotificationService**: Backward-compatible wrapper for legacy code

## Notification Types

### Transactional Emails

- **USER_VERIFICATION**: Email verification with JWT token
- **USER_WELCOME**: Welcome email for new users
- **PAYMENT_CONFIRMATION**: Payment received and held in escrow
- **PAYMENT_RELEASE**: Payment released to freelancer
- **PROJECT_INVITATION**: Project invitation to freelancer

### Alert Notifications

- **MILESTONE_SUBMITTED**: New milestone submission for review
- **MILESTONE_APPROVED**: Milestone approved by client
- **MILESTONE_REJECTED**: Milestone rejected
- **MILESTONE_REVISION_REQUESTED**: Milestone revision requested
- **DISPUTE_INITIATED**: Dispute raised by either party
- **DISPUTE_RESOLVED**: Dispute resolution notification
- **PROJECT_COMPLETED**: Project completion notification
- **REFUND_ISSUED**: Fund refund notification
- **MESSAGE_RECEIVED**: New message notification
- **PROJECT_STATUS_UPDATE**: Project status change
- **DEADLINE_REMINDER**: Milestone deadline approaching
- **ACCOUNT_SUSPENDED**: Account suspension notification
- **ACCOUNT_REACTIVATED**: Account reactivation notification
- **PAYMENT_FAILED**: Payment processing failure
- **WITHDRAWAL_PROCESSED**: Withdrawal processed notification
- **KYC_APPROVED**: Identity verification approved
- **KYC_REJECTED**: Identity verification rejected
- **AUTO_APPROVAL_WARNING**: Auto-approval reminder
- **INVOICE_GENERATED**: Invoice available notification

## Usage

### Basic Usage

```javascript
const notificationService = require('../services/email/notificationService');

// Send a verification email
await notificationService.sendVerificationEmail(user, token);

// Send a payment confirmation
await notificationService.sendPaymentConfirmation(client, project, amount, transactionId);

// Send generic notification
await notificationService.sendNotification('MILESTONE_SUBMITTED', {
  recipient,
  project,
  milestone
});
```

### Enhanced Usage

```javascript
const enhancedNotificationService = require('../services/email/enhancedNotificationService');

// Send any notification type
await enhancedNotificationService.sendNotification('DISPUTE_INITIATED', {
  recipient,
  project,
  milestone,
  reason
});
```

## Template System

All email templates are professionally designed with:

- Responsive HTML/CSS
- Brand-consistent styling
- Clear call-to-action buttons
- Professional layout
- Mobile-friendly design

Each template includes proper headers, footers, and branding elements.

## Configuration

The email service can be configured through environment variables:

- `EMAIL_HOST`: SMTP server host
- `EMAIL_PORT`: SMTP server port (default: 587)
- `EMAIL_SECURE`: Use secure connection (true/false)
- `EMAIL_USER`: SMTP username
- `EMAIL_PASS`: SMTP password
- `EMAIL_FROM`: Default from address
- `FRONTEND_URL`: Frontend URL for links

For development, the system defaults to ethereal.email for test emails.

## Error Handling

- All email functions are wrapped in try-catch blocks
- Failed email sends are logged to console
- No email failures cause transaction rollbacks
- Fallback methods can be implemented for critical messages

## Integration Points

The system is integrated with:

- User registration/verification flows
- Payment processing workflows
- Milestone management system
- Dispute resolution process
- Project invitation system
- Messaging system
- Account management

## Testing

The system includes comprehensive tests covering:

- Email validation
- All notification types
- Error handling
- Integration workflows
- Template rendering

Run tests with: `npm test -- emailNotification.test.js`

## Best Practices

1. Always use the notification service rather than sending emails directly
2. Include relevant context in all notification data
3. Handle notification failures gracefully
4. Use appropriate notification types for different scenarios
5. Include clear calls-to-action in templates
6. Maintain consistent branding across all templates
7. Test email rendering across different email clients

## Security Considerations

- User data is properly sanitized before template insertion
- No sensitive information is included in email templates
- JWT tokens are properly validated before use
- Email addresses are validated before sending