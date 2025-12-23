const nodemailer = require('nodemailer');

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

class NotificationService {
  async sendNotification(notificationType, data) {
    try {
      let subject, html;
      
      switch(notificationType) {
        case 'PAYMENT_CONFIRMATION':
          subject = 'Payment Deposit Confirmed';
          html = this.generatePaymentConfirmationEmail(data);
          break;
        case 'PAYMENT_RELEASE':
          subject = 'Payment Released';
          html = this.generatePaymentReleaseEmail(data);
          break;
        case 'MILESTONE_SUBMITTED':
          subject = 'Milestone Submitted for Review';
          html = this.generateMilestoneSubmittedEmail(data);
          break;
        case 'MILESTONE_APPROVED':
          subject = 'Milestone Approved';
          html = this.generateMilestoneApprovedEmail(data);
          break;
        case 'MILESTONE_REVISION_REQUESTED':
          subject = 'Milestone Revision Requested';
          html = this.generateMilestoneRevisionRequestedEmail(data);
          break;
        case 'DISPUTE_RAISED':
          subject = 'Dispute Raised';
          html = this.generateDisputeRaisedEmail(data);
          break;
        case 'DISPUTE_RESOLVED':
          subject = 'Dispute Resolved';
          html = this.generateDisputeResolvedEmail(data);
          break;
        case 'PROJECT_INVITE':
          subject = 'Project Invitation';
          html = this.generateProjectInviteEmail(data);
          break;
        case 'AUTO_APPROVAL_WARNING':
          subject = 'Auto-Approval Warning';
          html = this.generateAutoApprovalWarningEmail(data);
          break;
        case 'MILESTONE_AUTO_APPROVED':
          subject = 'Milestone Auto-Approved';
          html = this.generateMilestoneAutoApprovedEmail(data);
          break;
        case 'COUNTER_PROPOSAL_SUBMITTED':
          subject = 'Counter Proposal Submitted';
          html = this.generateCounterProposalEmail(data);
          break;
        default:
          throw new Error(`Unknown notification type: ${notificationType}`);
      }

      // Determine recipient based on data
      const recipient = this.getRecipientEmail(notificationType, data);
      
      if (!recipient) {
        throw new Error(`No recipient email found for notification type: ${notificationType}`);
      }

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@delivault.com',
        to: recipient,
        subject,
        html
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
      return info;
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  getRecipientEmail(notificationType, data) {
    switch(notificationType) {
      case 'PAYMENT_CONFIRMATION':
        return data.client.email;
      case 'PAYMENT_RELEASE':
        return data.freelancer.email;
      case 'MILESTONE_SUBMITTED':
        return data.client.email;
      case 'MILESTONE_APPROVED':
        return data.freelancer.email;
      case 'MILESTONE_REVISION_REQUESTED':
        return data.freelancer.email;
      case 'DISPUTE_RAISED':
        // Send to both parties
        return [data.project.client.email, data.project.freelancer.email].filter(Boolean).join(',');
      case 'DISPUTE_RESOLVED':
        return [data.project.client.email, data.project.freelancer.email].filter(Boolean).join(',');
      case 'PROJECT_INVITE':
        return data.invitedEmail;
      case 'AUTO_APPROVAL_WARNING':
        return data.client.email;
      case 'MILESTONE_AUTO_APPROVED':
        return data.freelancer.email;
      case 'COUNTER_PROPOSAL_SUBMITTED':
        return data.client.email; // Send to client when freelancer submits counter proposal
      default:
        return null;
    }
  }

  generatePaymentConfirmationEmail(data) {
    return `
      <h2>Payment Deposit Confirmed</h2>
      <p>Dear ${data.client.firstName},</p>
      <p>Your payment of $${(data.amount / 100).toFixed(2)} for project "${data.project.title}" has been successfully processed.</p>
      <p>Funds are now securely held in escrow and will be released to the freelancer upon milestone completion and approval.</p>
      <p>Transaction ID: ${data.transactionId}</p>
      <p>Thank you for using Delivault!</p>
    `;
  }

  generatePaymentReleaseEmail(data) {
    return `
      <h2>Payment Released</h2>
      <p>Dear ${data.freelancer.firstName},</p>
      <p>Payment of $${(data.amount / 100).toFixed(2)} for milestone "${data.milestone.title}" has been released from escrow.</p>
      <p>The funds have been transferred to your account.</p>
      <p>Project: ${data.project.title}</p>
      <p>Thank you for your work!</p>
    `;
  }

  generateMilestoneSubmittedEmail(data) {
    return `
      <h2>Milestone Submitted for Review</h2>
      <p>Dear ${data.client.firstName},</p>
      <p>The freelancer has submitted milestone "${data.milestone.title}" for your review.</p>
      <p>Please review the deliverables and approve or request revisions.</p>
      <p>Project: ${data.project.title}</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/projects/${data.project._id}">Review Milestone</a></p>
    `;
  }

  generateMilestoneApprovedEmail(data) {
    return `
      <h2>Milestone Approved</h2>
      <p>Dear ${data.freelancer.firstName},</p>
      <p>Your milestone "${data.milestone.title}" has been approved by the client.</p>
      <p>Payment of $${(data.amount / 100).toFixed(2)} has been released to your account.</p>
      <p>Project: ${data.project.title}</p>
    `;
  }

  generateMilestoneRevisionRequestedEmail(data) {
    return `
      <h2>Milestone Revision Requested</h2>
      <p>Dear ${data.freelancer.firstName},</p>
      <p>The client has requested revisions for milestone "${data.milestone.title}".</p>
      <p>Reason: ${data.revisionNotes}</p>
      <p>Please update the deliverables and resubmit for review.</p>
      <p>Project: ${data.project.title}</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/projects/${data.project._id}">Revise Milestone</a></p>
    `;
  }

  generateDisputeRaisedEmail(data) {
    return `
      <h2>Dispute Raised</h2>
      <p>A dispute has been raised for milestone "${data.milestone.title}" on project "${data.project.title}".</p>
      <p>Reason: ${data.dispute.reason}</p>
      <p>The dispute resolution process has been initiated.</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/disputes/${data.dispute._id}">View Dispute</a></p>
    `;
  }

  generateDisputeResolvedEmail(data) {
    return `
      <h2>Dispute Resolved</h2>
      <p>The dispute for milestone "${data.milestone.title}" on project "${data.project.title}" has been resolved.</p>
      <p>Decision: ${data.decision}</p>
      <p>Resolution details: ${data.resolutionDetails || 'Not specified'}</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/disputes/${data.dispute._id}">View Resolution</a></p>
    `;
  }

  generateProjectInviteEmail(data) {
    return `
      <h2>Project Invitation</h2>
      <p>You have been invited to join the project "${data.project.title}".</p>
      <p>Client: ${data.invitor.firstName} ${data.invitor.lastName}</p>
      <p>Project description: ${data.project.description}</p>
      <p>Budget: $${(data.project.budget / 100).toFixed(2)}</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/projects/invitations">View Invitation</a></p>
    `;
  }

  generateAutoApprovalWarningEmail(data) {
    return `
      <h2>Auto-Approval Notice</h2>
      <p>Dear ${data.client.firstName},</p>
      <p>Milestone "${data.milestone.title}" will be automatically approved in ${data.daysRemaining} days if no action is taken.</p>
      <p>Please review the deliverables and approve or dispute the milestone if needed.</p>
      <p>Project: ${data.project.title}</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/projects/${data.project._id}">Review Milestone</a></p>
    `;
  }

  generateMilestoneAutoApprovedEmail(data) {
    return `
      <h2>Milestone Auto-Approved</h2>
      <p>Dear ${data.freelancer.firstName},</p>
      <p>Milestone "${data.milestone.title}" has been automatically approved after ${data.autoApprovalPeriod || 7} days.</p>
      <p>Payment of $${(data.amount / 100).toFixed(2)} has been released to your account.</p>
      <p>Project: ${data.project.title}</p>
    `;
  }

  generateCounterProposalEmail(data) {
    return `
      <h2>Counter Proposal Submitted</h2>
      <p>Dear ${data.client.firstName},</p>
      <p>The freelancer has submitted counter proposals for one or more milestones in project "${data.project.title}".</p>
      <p>Proposal Details:</p>
      <ul>
        ${data.proposals.map(proposal => `
          <li>
            <strong>Milestone:</strong> ${proposal.milestoneTitle || 'Unknown'}<br>
            <strong>Changes:</strong> ${proposal.changes.map(change => change.field + ': ' + change.oldValue + ' → ' + change.newValue).join(', ')}<br>
            <strong>Reason:</strong> ${proposal.reason || 'Not specified'}
          </li>
        `).join('')}
      </ul>
      <p>Please review the proposed changes and respond accordingly.</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/client/projects/${data.project._id}">Review Proposal</a></p>
    `;
  }
}

module.exports = new NotificationService();