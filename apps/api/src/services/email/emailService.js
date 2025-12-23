const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create transporter based on environment
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Production configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true' || false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
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
        }
      });
    }
  }

  // Validate email addresses
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Send a transactional email
  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.isValidEmail(to)) {
        throw new Error(`Invalid email address: ${to}`);
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@contralock.com',
        to,
        subject,
        html,
        ...(text && { text }),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId, info.response);
      return info;
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error(`Failed to send email to ${to}: ${error.message}`);
    }
  }

  // Send verification email
  async sendVerificationEmail(user, token) {
    const subject = 'Verify Your Email Address';
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .content { padding: 20px 0; }
          .button { 
            display: inline-block; 
            background-color: #4f46e5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding-top: 20px; 
            font-size: 0.9em; 
            color: #666; 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Delivault!</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName || user.email},</p>
            <p>Thank you for registering with Delivault. To get started, please verify your email address by clicking the button below:</p>
            <center><a href="${verificationLink}" class="button">Verify Email</a></center>
            <p>If you cannot click the button, copy and paste this link into your browser:</p>
            <p>${verificationLink}</p>
            <p>This link will expire in 24 hours.</p>
            <p>Best regards,<br>The Delivault Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email} because you signed up for Delivault.</p>
            <p>© 2025 Delivault. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Delivault!';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Delivault</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .content { padding: 20px 0; }
          .button { 
            display: inline-block; 
            background-color: #4f46e5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
          }
          .feature-list { 
            background-color: #f8fafc; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 15px 0; 
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding-top: 20px; 
            font-size: 0.9em; 
            color: #666; 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Delivault, ${user.firstName || 'New User'}!</h1>
          </div>
          <div class="content">
            <p>We're excited to have you join our community of freelancers and clients!</p>
            
            <div class="feature-list">
              <h3>How to get started:</h3>
              <ul>
                <li><strong>For Freelancers:</strong> Create your profile, showcase your skills, and find great projects</li>
                <li><strong>For Clients:</strong> Post your project, find skilled freelancers, and pay securely</li>
              </ul>
            </div>
            
            <p>Delivault ensures secure, milestone-based payments that protect both freelancers and clients through our escrow system.</p>
            
            <p>Have questions? Visit our <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/help">Help Center</a> or contact our team.</p>
            
            <p>Best regards,<br>The Delivault Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email} because you signed up for Delivault.</p>
            <p>© 2025 Delivault. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Send payment confirmation email
  async sendPaymentConfirmation(user, project, amount, transactionId) {
    const subject = `Payment Confirmation for ${project.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .content { padding: 20px 0; }
          .info-box { 
            background-color: #f0f9ff; 
            padding: 15px; 
            border-left: 4px solid #3b82f6; 
            margin: 15px 0; 
          }
          .summary { 
            background-color: #f9fafb; 
            padding: 10px 15px; 
            border: 1px solid #e5e7eb; 
            border-radius: 4px; 
            margin: 10px 0; 
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding-top: 20px; 
            font-size: 0.9em; 
            color: #666; 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Received</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName || user.email},</p>
            
            <div class="info-box">
              <p>We have received your payment for the project <strong>"${project.title}"</strong>.</p>
            </div>
            
            <div class="summary">
              <h3>Transaction Details:</h3>
              <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Project:</strong> ${project.title}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>The funds have been securely placed in escrow and will be released to the freelancer according to the milestone schedule.</p>
            
            <p>You can track the progress of this project in your dashboard.</p>
            
            <p>Questions? Visit <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard">your dashboard</a>.</p>
            
            <p>Best regards,<br>The Delivault Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email} regarding your Delivault project.</p>
            <p>© 2025 Delivault. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Send milestone update email
  async sendMilestoneUpdate(user, project, milestone, status, message) {
    const subject = `Milestone Update for ${project.title}`;
    let statusText = '';
    let statusColor = '';
    
    switch(status) {
      case 'SUBMITTED':
        statusText = 'Submitted for Review';
        statusColor = '#fbbf24'; // amber
        break;
      case 'APPROVED':
        statusText = 'Approved';
        statusColor = '#10b981'; // emerald
        break;
      case 'REVISION_REQUESTED':
        statusText = 'Revision Requested';
        statusColor = '#f97316'; // orange
        break;
      case 'DISPUTED':
        statusText = 'Disputed';
        statusColor = '#ef4444'; // red
        break;
      default:
        statusText = status;
        statusColor = '#6b7280'; // gray
    }
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Milestone Update: ${statusText}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .content { padding: 20px 0; }
          .status-badge { 
            display: inline-block; 
            padding: 5px 10px; 
            border-radius: 20px; 
            background-color: ${statusColor}; 
            color: white; 
            font-weight: bold; 
            text-transform: uppercase; 
            font-size: 0.8em; 
          }
          .milestone-info { 
            background-color: #f9fafb; 
            padding: 15px; 
            border: 1px solid #e5e7eb; 
            border-radius: 4px; 
            margin: 15px 0; 
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding-top: 20px; 
            font-size: 0.9em; 
            color: #666; 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Milestone Update</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName || user.email},</p>
            
            <p>A milestone in your project has been updated:</p>
            
            <div class="milestone-info">
              <h3><span class="status-badge">${statusText}</span> ${milestone.title}</h3>
              <p><strong>Project:</strong> ${project.title}</p>
              <p><strong>Description:</strong> ${milestone.description}</p>
              <p><strong>Amount:</strong> $${(milestone.amount / 100).toFixed(2)}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            </div>
            
            <p>You can view the full project details in your dashboard.</p>
            
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/projects/${project._id}">View Project</a></p>
            
            <p>Best regards,<br>The Delivault Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email} regarding your Delivault project.</p>
            <p>© 2025 Delivault. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Send dispute resolution email
  async sendDisputeResolution(user, project, dispute, resolution) {
    const subject = `Dispute Resolution: ${project.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dispute Resolution</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .content { padding: 20px 0; }
          .resolution-box { 
            background-color: #fef2f2; 
            padding: 15px; 
            border-left: 4px solid #ef4444; 
            margin: 15px 0; 
          }
          .info-section { 
            background-color: #f9fafb; 
            padding: 15px; 
            border: 1px solid #e5e7eb; 
            border-radius: 4px; 
            margin: 15px 0; 
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding-top: 20px; 
            font-size: 0.9em; 
            color: #666; 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Dispute Resolution</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName || user.email},</p>
            
            <div class="resolution-box">
              <p>The dispute for milestone "${dispute.milestone.title}" in project "${project.title}" has been resolved.</p>
            </div>
            
            <div class="info-section">
              <h3>Resolution Details:</h3>
              <p><strong>Decision:</strong> ${resolution.decision}</p>
              ${resolution.amountToFreelancer ? `<p><strong>Amount to Freelancer:</strong> $${(resolution.amountToFreelancer / 100).toFixed(2)}</p>` : ''}
              ${resolution.amountToClient ? `<p><strong>Amount to Client:</strong> $${(resolution.amountToClient / 100).toFixed(2)}</p>` : ''}
              <p><strong>Reason:</strong> ${resolution.decisionReason}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            ${resolution.decision.includes('payment') ? `
              <p>The funds have been processed according to the resolution. Please note that it may take 1-3 business days for the payment to be finalized.</p>
            ` : ''}
            
            <p>Questions? Contact our support team or visit your <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard">dashboard</a>.</p>
            
            <p>Best regards,<br>The Delivault Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email} regarding a Delivault dispute.</p>
            <p>© 2025 Delivault. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Send project invitation email to freelancer
  async sendProjectInvitation(freelancer, client, project) {
    const subject = `Project Invitation: ${project.title}`;
    const acceptLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations?project=${project._id}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Project Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .content { padding: 20px 0; }
          .project-details { 
            background-color: #f9fafb; 
            padding: 15px; 
            border: 1px solid #e5e7eb; 
            border-radius: 4px; 
            margin: 15px 0; 
          }
          .button { 
            display: inline-block; 
            background-color: #4f46e5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding-top: 20px; 
            font-size: 0.9em; 
            color: #666; 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Project Invitation</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            
            <p>You have been invited to join a project by ${client.firstName || client.email}:</p>
            
            <div class="project-details">
              <h3>${project.title}</h3>
              <p><strong>Client:</strong> ${client.firstName || client.email}</p>
              <p><strong>Budget:</strong> $${(project.budget / 100).toFixed(2)}</p>
              <p><strong>Deadline:</strong> ${new Date(project.deadline).toLocaleDateString()}</p>
              <p><strong>Description:</strong> ${project.description}</p>
            </div>
            
            <p>To view and respond to this invitation:</p>
            <center><a href="${acceptLink}" class="button">View Project Invitation</a></center>
            
            <p>If you cannot click the button, copy and paste this link into your browser:</p>
            <p>${acceptLink}</p>
            
            <p>Best regards,<br>The Delivault Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to you regarding a project invitation on Delivault.</p>
            <p>© 2025 Delivault. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(freelancer.email, subject, html);
  }

  // Send payment release notification to freelancer
  async sendPaymentReleaseNotification(freelancer, project, milestone, amount) {
    const subject = `Payment Released: ${project.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Released</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .content { padding: 20px 0; }
          .success-box { 
            background-color: #ecfdf5; 
            padding: 15px; 
            border-left: 4px solid #10b981; 
            margin: 15px 0; 
          }
          .payment-details { 
            background-color: #f9fafb; 
            padding: 15px; 
            border: 1px solid #e5e7eb; 
            border-radius: 4px; 
            margin: 15px 0; 
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding-top: 20px; 
            font-size: 0.9em; 
            color: #666; 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Released</h1>
          </div>
          <div class="content">
            <p>Hello ${freelancer.firstName || freelancer.email},</p>
            
            <div class="success-box">
              <p>Congratulations! A payment has been released to your account for your work on "${project.title}".</p>
            </div>
            
            <div class="payment-details">
              <h3>Payment Details:</h3>
              <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
              <p><strong>Milestone:</strong> ${milestone.title}</p>
              <p><strong>Project:</strong> ${project.title}</p>
              <p><strong>Date Released:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>The funds are now available in your account. You can withdraw them or use them for other projects.</p>
            <p>Check your <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard">dashboard</a> for full details.</p>
            
            <p>Thank you for your excellent work!</p>
            
            <p>Best regards,<br>The Delivault Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${freelancer.email} regarding a payment release.</p>
            <p>© 2025 Delivault. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(freelancer.email, subject, html);
  }
}

module.exports = new EmailService();