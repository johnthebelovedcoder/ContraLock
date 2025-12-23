const cron = require('node-cron');
const logger = require('../utils/logger');
const { Project, Milestone, User, Dispute } = require('../models/modelManager');
const { notifyProject } = require('../socket/server');
const stripeService = require('./paymentService');
const notificationService = require('./email/enhancedNotificationService');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Initialize all scheduled tasks
  async initialize() {
    try {
      // Auto-approve milestones that have passed their auto-approval period
      this.scheduleAutoApprovals();
      
      // Send reminder notifications for approaching deadlines
      this.scheduleDeadlineReminders();
      
      // Clean up old temporary files
      this.scheduleFileCleanup();
      
      // Update user statistics periodically
      this.scheduleStatisticsUpdate();
      
      // Process any pending disputes that need automated review
      this.scheduleDisputeProcessing();
      
      logger.info('Scheduler service initialized with all scheduled tasks');
    } catch (error) {
      logger.error('Error initializing scheduler service', { error: error.message });
      throw error;
    }
  }

  // Start all scheduled tasks
  async start() {
    if (this.isRunning) {
      logger.warn('Scheduler service is already running');
      return;
    }

    try {
      await this.initialize();
      this.isRunning = true;
      logger.info('Scheduler service started');
    } catch (error) {
      logger.error('Error starting scheduler service', { error: error.message });
      throw error;
    }
  }

  // Stop all scheduled tasks
  async stop() {
    if (!this.isRunning) {
      logger.warn('Scheduler service is not running');
      return;
    }

    try {
      for (const [name, job] of this.jobs) {
        job.stop();
        logger.info(`Stopped scheduled job: ${name}`);
      }
      
      this.jobs.clear();
      this.isRunning = false;
      logger.info('Scheduler service stopped');
    } catch (error) {
      logger.error('Error stopping scheduler service', { error: error.message });
      throw error;
    }
  }

  // Schedule auto-approval of milestones
  scheduleAutoApprovals() {
    // Check every hour for milestones that need auto-approval
    const job = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Checking for milestones requiring auto-approval');
        
        const now = new Date();
        const milestones = await Milestone.find({
          status: 'SUBMITTED',
          autoApproveAt: { $lte: now }
        });

        for (const milestone of milestones) {
          try {
            // Get the associated project and users
            const project = await Project.findById(milestone.project);
            if (!project) {
              logger.error('Project not found for milestone', { milestoneId: milestone._id });
              continue;
            }

            const freelancer = await User.findById(project.freelancer);
            const client = await User.findById(project.client);

            // Auto-approve the milestone
            milestone.status = 'APPROVED';
            milestone.approvedAt = new Date();
            await milestone.save();

            // Update project escrow
            project.escrow.totalReleased += milestone.amount;
            project.escrow.remaining -= milestone.amount;

            // Check if all milestones are approved
            const allMilestones = await Milestone.find({ project: project._id });
            const allApproved = allMilestones.every(m => m.status === 'APPROVED');
            if (allApproved) {
              project.status = 'COMPLETED';
            }

            await project.save();

            // Release payment to freelancer using split fee model
            // Client paid 1.9% upfront, freelancer pays 3.6% on release
            const projectPaymentSchedule = project.paymentSchedule ? JSON.parse(project.paymentSchedule) : {};
            const freelancerFeePercent = projectPaymentSchedule.freelancerFeePercent || 3.6; // 3.6% from freelancer

            // Convert milestone amount from currency units to base units for calculation
            let amountInBaseUnits;
            let currency = milestone.currency || project.currency || 'USD';
            switch (currency.toUpperCase()) {
              case 'JPY':
                // JPY has no decimal places
                amountInBaseUnits = milestone.amount;
                break;
              case 'BTC':
                // BTC uses 8 decimal places (satoshi)
                amountInBaseUnits = milestone.amount / 100000000;
                break;
              case 'ETH':
                // ETH uses 18 decimal places (wei)
                amountInBaseUnits = milestone.amount / 1000000000000000000;
                break;
              default:
                // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
                amountInBaseUnits = milestone.amount / 100;
            }

            const freelancerFee = amountInBaseUnits * (freelancerFeePercent / 100);
            const netAmount = amountInBaseUnits - freelancerFee; // Amount after freelancer fee

            // Transfer to freelancer's connected account (if they have one)
            if (freelancer && freelancer.stripeAccountId) {
              try {
                await stripeService.transferToFreelancer(
                  netAmount,
                  freelancer.stripeAccountId,
                  `Auto-approved payment for milestone: ${milestone.title}`
                );
              } catch (transferError) {
                logger.error('Failed to transfer payment to freelancer', {
                  error: transferError.message,
                  freelancerId: freelancer._id
                });
              }
            }

            // Send notification to freelancer
            if (freelancer) {
              await notificationService.sendNotification('MILESTONE_AUTO_APPROVED', {
                freelancer: freelancer,
                project: project,
                milestone: milestone,
                amount: netAmount,
                autoApprovalPeriod: project.paymentSchedule?.autoApproveDays || 7
              });
            }

            // Add to project activity log
            project.activityLog.push({
              action: 'MILESTONE_AUTO_APPROVED',
              performedBy: 'SYSTEM',
              details: {
                milestoneId: milestone._id,
                amount: netAmount,
                reason: 'Auto-approval period expired'
              }
            });
            await project.save();

            // Emit socket notification
            notifyProject(project._id, 'milestone-auto-approved', {
              milestoneId: milestone._id,
              projectId: project._id,
              amount: netAmount,
              timestamp: new Date()
            });

            logger.info('Milestone auto-approved', {
              milestoneId: milestone._id,
              projectId: project._id,
              amount: netAmount
            });
          } catch (milestoneError) {
            logger.error('Error auto-approving milestone', {
              milestoneId: milestone._id,
              error: milestoneError.message
            });
          }
        }

        logger.info('Auto-approval check completed', { processed: milestones.length });
      } catch (error) {
        logger.error('Error in auto-approval cron job', { error: error.message });
      }
    });

    this.jobs.set('auto-approvals', job);
    logger.info('Scheduled auto-approval job: 0 * * * * (every hour)');
  }

  // Schedule deadline reminders
  scheduleDeadlineReminders() {
    // Check daily for approaching deadlines
    const job = cron.schedule('0 9 * * *', async () => {
      try {
        logger.info('Checking for deadline reminders');
        
        const now = new Date();
        const reminderThreshold = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days ahead
        const milestones = await Milestone.find({
          status: { $in: ['PENDING', 'IN_PROGRESS'] },
          deadline: { $gte: now, $lte: reminderThreshold }
        });

        for (const milestone of milestones) {
          try {
            const project = await Project.findById(milestone.project);
            if (!project) continue;

            const daysLeft = Math.ceil((milestone.deadline - now) / (1000 * 60 * 60 * 24));
            
            // Send reminders to both freelancer and client
            const freelancer = await User.findById(project.freelancer);
            if (freelancer) {
              await notificationService.sendNotification('MILESTONE_DEADLINE_REMINDER', {
                user: freelancer,
                project: project,
                milestone: milestone,
                daysLeft: daysLeft
              });
            }

            const client = await User.findById(project.client);
            if (client) {
              await notificationService.sendNotification('MILESTONE_DEADLINE_REMINDER', {
                user: client,
                project: project,
                milestone: milestone,
                daysLeft: daysLeft
              });
            }

            logger.info('Deadline reminder sent', {
              milestoneId: milestone._id,
              projectId: project._id,
              daysLeft: daysLeft
            });
          } catch (reminderError) {
            logger.error('Error sending deadline reminder', {
              milestoneId: milestone._id,
              error: reminderError.message
            });
          }
        }

        logger.info('Deadline reminder check completed', { processed: milestones.length });
      } catch (error) {
        logger.error('Error in deadline reminder cron job', { error: error.message });
      }
    });

    this.jobs.set('deadline-reminders', job);
    logger.info('Scheduled deadline reminder job: 0 9 * * * (daily at 9 AM)');
  }

  // Schedule temporary file cleanup
  scheduleFileCleanup() {
    // Clean up temporary files every day at 2 AM
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Starting temporary file cleanup');
        
        const fs = require('fs');
        const path = require('path');
        const tempDir = path.join(__dirname, '..', '..', '..', 'temp_uploads');
        
        if (fs.existsSync(tempDir)) {
          const files = fs.readdirSync(tempDir);
          const now = Date.now();
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

          let deletedCount = 0;
          for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stat = fs.statSync(filePath);
            
            // Delete files older than 24 hours
            if (now - stat.mtime > maxAge) {
              try {
                fs.unlinkSync(filePath);
                deletedCount++;
                logger.info(`Deleted old temp file: ${file}`);
              } catch (unlinkError) {
                logger.error('Error deleting temp file', {
                  file: file,
                  error: unlinkError.message
                });
              }
            }
          }

          logger.info('Temporary file cleanup completed', { deleted: deletedCount });
        } else {
          logger.info('Temporary upload directory does not exist');
        }
      } catch (error) {
        logger.error('Error in file cleanup cron job', { error: error.message });
      }
    });

    this.jobs.set('file-cleanup', job);
    logger.info('Scheduled file cleanup job: 0 2 * * * (daily at 2 AM)');
  }

  // Schedule statistics update
  scheduleStatisticsUpdate() {
    // Update user statistics weekly (Sunday at midnight)
    const job = cron.schedule('0 0 * * 0', async () => {
      try {
        logger.info('Starting user statistics update');
        
        const users = await User.find({});
        let updatedCount = 0;

        for (const user of users) {
          try {
            // Calculate total earned
            const projects = await Project.find({
              [user.role === 'freelancer' ? 'freelancer' : 'client']: user._id,
              status: 'COMPLETED'
            });

            let totalEarned = 0;
            let completedProjects = 0;

            for (const project of projects) {
              if (user.role === 'freelancer') {
                // For freelancers, calculate based on milestone payments
                const milestones = await Milestone.find({
                  project: project._id,
                  status: 'APPROVED'
                });
                totalEarned += milestones.reduce((sum, m) => sum + m.amount, 0);
              } else {
                // For clients, just count completed projects
                completedProjects++;
              }
            }

            // Update user statistics
            user.statistics = user.statistics || {};
            user.statistics.totalEarned = totalEarned;
            user.statistics.completedProjects = completedProjects;
            user.statistics.lastUpdated = new Date();

            await user.save();
            updatedCount++;
          } catch (statError) {
            logger.error('Error updating user statistics', {
              userId: user._id,
              error: statError.message
            });
          }
        }

        logger.info('User statistics update completed', { updated: updatedCount });
      } catch (error) {
        logger.error('Error in statistics update cron job', { error: error.message });
      }
    });

    this.jobs.set('statistics-update', job);
    logger.info('Scheduled statistics update job: 0 0 * * 0 (weekly on Sunday)');
  }

  // Schedule dispute processing
  scheduleDisputeProcessing() {
    // Check for disputes that need automated processing
    const job = cron.schedule('0 */6 * * *', async () => { // Every 6 hours
      try {
        logger.info('Checking for disputes requiring automated processing');
        
        // Find disputes in PENDING_REVIEW status older than a certain threshold
        const reviewThreshold = new Date();
        reviewThreshold.setDate(reviewThreshold.getDate() - 7); // 7 days old
        
        const disputes = await Dispute.find({
          status: 'PENDING_REVIEW',
          createdAt: { $lte: reviewThreshold }
        });

        for (const dispute of disputes) {
          try {
            // Process the dispute automatically based on available data
            const project = await Project.findById(dispute.project);
            const milestone = await Milestone.findById(dispute.milestone);
            
            if (project && milestone) {
              // Basic automated resolution logic (would be more sophisticated in production)
              const resolution = {
                decision: 'REVIEW_REQUIRED',
                decisionReason: 'Automated review suggests case requires human attention',
                resolvedAt: new Date(),
                resolvedBy: 'SYSTEM'
              };
              
              dispute.status = 'IN_MEDIATION';
              dispute.resolution = resolution;
              await dispute.save();

              // Send notification about automated review
              await notificationService.sendNotification('DISPUTE_AUTO_REVIEWED', {
                project: project,
                dispute: dispute,
                resolution: resolution
              });

              logger.info('Dispute auto-processed', {
                disputeId: dispute._id,
                decision: resolution.decision
              });
            }
          } catch (disputeError) {
            logger.error('Error processing dispute automatically', {
              disputeId: dispute._id,
              error: disputeError.message
            });
          }
        }

        logger.info('Dispute processing check completed', { processed: disputes.length });
      } catch (error) {
        logger.error('Error in dispute processing cron job', { error: error.message });
      }
    });

    this.jobs.set('dispute-processing', job);
    logger.info('Scheduled dispute processing job: 0 */6 * * * (every 6 hours)');
  }

  // Add a custom scheduled task
  addTask(name, cronExpression, taskFunction) {
    if (this.jobs.has(name)) {
      logger.warn(`Task ${name} already exists, replacing it`);
      this.jobs.get(name).stop();
    }

    const job = cron.schedule(cronExpression, taskFunction);
    this.jobs.set(name, job);
    logger.info(`Added custom scheduled task: ${name}`, { cron: cronExpression });
  }

  // Get status of all scheduled jobs
  getStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        scheduled: true
      };
    }
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.size,
      jobs: status
    };
  }
}

module.exports = new SchedulerService();