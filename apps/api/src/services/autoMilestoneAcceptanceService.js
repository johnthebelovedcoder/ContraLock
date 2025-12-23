// Automated Milestone Acceptance Service
const cron = require('node-cron');
const { Project, Notification } = require('../models/modelManager');
const { sendNotificationToUser } = require('../socket/server');
const { NotificationType } = require('../utils/constants'); // Assuming you have constants

class AutoMilestoneAcceptanceService {
  constructor() {
    // Run the automated milestone approval check every hour
    this.task = cron.schedule('0 * * * *', () => {
      this.processAutoApprovals().catch(error => {
        console.error('Error in auto milestone approval check:', error);
      });
    });
  }

  async start() {
    this.task.start();
    console.log('Auto milestone acceptance service started');
  }

  async stop() {
    this.task.stop();
    console.log('Auto milestone acceptance service stopped');
  }

  async processAutoApprovals() {
    console.log('Starting auto milestone approval check...');
    
    try {
      // Find all submitted milestones where the auto-approval deadline has passed
      const now = new Date();
      const submittedMilestones = await Project.find({
        'milestones.status': 'SUBMITTED'
      });

      let processedCount = 0;

      for (const project of submittedMilestones) {
        for (const milestone of project.milestones) {
          if (milestone.status === 'SUBMITTED') {
            // Calculate the deadline based on the project's autoApprovalPeriod
            const autoApprovalPeriod = project.paymentSchedule?.autoApprovalPeriod || 7; // Default to 7 days
            const submitDate = milestone.submittedAt || milestone.createdAt; // Use submittedAt if available, fallback to createdAt
            const deadline = new Date(submitDate);
            deadline.setDate(deadline.getDate() + autoApprovalPeriod);

            if (now >= deadline) {
              // Automatic approval condition met - approve the milestone
              await this.approveMilestoneAutomatically(project, milestone, autoApprovalPeriod);
              processedCount++;
            } else {
              // Check if we should send a warning notification before auto-approval
              const hoursToDeadline = (deadline - now) / (1000 * 60 * 60);
              if (hoursToDeadline <= 48 && hoursToDeadline > 24) { // Warn 24-48 hours before auto-approval
                await this.sendAutoApprovalWarning(project, milestone, autoApprovalPeriod);
              }
            }
          }
        }
      }

      console.log(`Auto milestone approval check completed. Processed ${processedCount} milestones.`);
    } catch (error) {
      console.error('Error processing auto milestone approvals:', error);
      throw error;
    }
  }

  async approveMilestoneAutomatically(project, milestone, autoApprovalPeriod) {
    console.log(`Automatically approving milestone ${milestone._id} for project ${project._id}`);
    
    try {
      // Use the centralized auto-approve milestone function from the milestone controller
      const { autoApproveMilestone } = require('../controllers/milestoneController');
      await autoApproveMilestone(milestone._id);

      // Emit real-time notification about automatic approval
      try {
        const { notifyProject } = require('../socket/server');
        notifyProject(project._id, 'milestone-status-change', {
          projectId: project._id,
          milestoneId: milestone._id,
          oldStatus: 'SUBMITTED',
          newStatus: 'APPROVED',
          updatedBy: 'SYSTEM',
          timestamp: new Date(),
          message: `Milestone "${milestone.title}" automatically approved after ${autoApprovalPeriod} days`,
          autoApproved: true
        });
      } catch (socketError) {
        console.error('Failed to emit automatic approval notification via WebSocket:', socketError);
      }

      // Create notification for both client and freelancer
      await this.createAutoApprovalNotification(project, milestone);

      console.log(`Successfully auto-approved milestone ${milestone._id} for project ${project._id}`);
    } catch (error) {
      console.error(`Error auto-approving milestone ${milestone._id}:`, error);
      // Don't throw - continue with other milestones
    }
  }

  async sendAutoApprovalWarning(project, milestone, autoApprovalPeriod) {
    try {
      const daysRemaining = Math.ceil(((milestone.submittedAt || milestone.createdAt) + (autoApprovalPeriod * 24 * 60 * 60 * 1000) - Date.now()) / (1000 * 60 * 60 * 24));
      
      // Add activity log entry
      project.activityLog.push({
        action: 'AUTO_APPROVAL_WARNING_SENT',
        performedBy: 'SYSTEM',
        details: {
          milestoneId: milestone._id,
          daysRemaining,
          autoApprovalPeriod
        }
      });

      await project.save();

      // Send warning notifications
      await this.createAutoApprovalWarningNotification(project, milestone, daysRemaining);

      console.log(`Auto-approval warning sent for milestone ${milestone._id}, ${daysRemaining} days remaining`);
    } catch (error) {
      console.error(`Error sending auto-approval warning for milestone ${milestone._id}:`, error);
    }
  }

  async createAutoApprovalNotification(project, milestone) {
    try {
      // Create notification for the freelancer
      if (project.freelancer) {
        const freelancerNotification = new Notification({
          userId: project.freelancer,
          type: 'MILESTONE_AUTO_APPROVED',
          title: `Milestone Auto-Approved: ${milestone.title}`,
          message: `Your milestone "${milestone.title}" has been automatically approved after ${project.paymentSchedule?.autoApprovalPeriod || 7} days.`,
          relatedEntity: 'Milestone',
          relatedEntityId: milestone._id,
          priority: 'NORMAL',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await freelancerNotification.save();

        // Send real-time notification
        sendNotificationToUser(project.freelancer, {
          type: 'MILESTONE_AUTO_APPROVED',
          message: `Milestone "${milestone.title}" has been automatically approved`,
          timestamp: new Date()
        });
      }

      // Create notification for the client
      if (project.client) {
        const clientNotification = new Notification({
          userId: project.client,
          type: 'MILESTONE_AUTO_APPROVED',
          title: `Milestone Auto-Approved: ${milestone.title}`,
          message: `Milestone "${milestone.title}" has been automatically approved after ${project.paymentSchedule?.autoApprovalPeriod || 7} days.`,
          relatedEntity: 'Milestone',
          relatedEntityId: milestone._id,
          priority: 'NORMAL',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await clientNotification.save();

        // Send real-time notification
        sendNotificationToUser(project.client, {
          type: 'MILESTONE_AUTO_APPROVED',
          message: `Milestone "${milestone.title}" has been automatically approved`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error creating auto approval notification:', error);
    }
  }

  async createAutoApprovalWarningNotification(project, milestone, daysRemaining) {
    try {
      // Create warning notification for the client
      if (project.client) {
        const notification = new Notification({
          userId: project.client,
          type: 'AUTO_APPROVAL_WARNING',
          title: `Auto-Approval Notice: ${milestone.title}`,
          message: `Milestone "${milestone.title}" will be automatically approved in ${daysRemaining} days if no action is taken.`,
          relatedEntity: 'Milestone',
          relatedEntityId: milestone._id,
          priority: 'NORMAL',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await notification.save();

        // Send real-time notification
        sendNotificationToUser(project.client, {
          type: 'AUTO_APPROVAL_WARNING',
          message: `Milestone "${milestone.title}" auto-approval in ${daysRemaining} days`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error creating auto approval warning notification:', error);
    }
  }
}

module.exports = AutoMilestoneAcceptanceService;