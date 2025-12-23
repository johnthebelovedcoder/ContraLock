const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const {
  getMilestones,
  getMilestone,
  createMilestone,
  startMilestone,
  submitMilestone,
  approveMilestone,
  requestRevision
} = require('../controllers/milestoneController');
const { Project, Milestone, Dispute } = require('../models/modelManager');
const { processAIAnalysis } = require('../services/aiService');
const { notifyProject } = require('../socket/server');
const { Op } = require('sequelize');

const router = express.Router();

// Get all milestones for a project
router.get('/project/:projectId', authenticateToken, getMilestones);

// Get a specific milestone - updated to match frontend expectations
router.get('/:milestoneId', authenticateToken, getMilestone);

// Create a milestone
router.post('/project/:projectId', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('description').trim().isLength({ min: 1, max: 500 }),
  body('amount').isFloat({ min: 50 }), // Amount in USD
  body('deadline').isISO8601(),
  body('acceptanceCriteria').trim().isLength({ min: 1, max: 1000 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Convert amount to cents for storage
    req.body.amount = Math.round(req.body.amount * 100);
    
    await createMilestone(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Start working on a milestone - updated to match frontend expectations
router.post('/:milestoneId/start', authenticateToken, startMilestone);

// Submit milestone for review - updated to match frontend expectations
router.post('/:milestoneId/submit', authenticateToken, [
  body('deliverables').optional().isArray(),
  body('deliverables.*.filename').optional().trim(),
  body('deliverables.*.url').optional().isURL(),
  body('submissionNotes').optional().trim().isLength({ max: 1000 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await submitMilestone(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Approve milestone - updated to match frontend expectations
router.post('/:milestoneId/approve', authenticateToken, approveMilestone);

// Request revision for milestone - updated to match frontend expectations
router.post('/:milestoneId/request-revision', authenticateToken, [
  body('revisionNotes').trim().isLength({ min: 1, max: 1000 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await requestRevision(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Get milestone statistics for a project
router.get('/project/:projectId/stats', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Verify user has access to project
    const project = await Project.findById(projectId);
    if (!project || (project.client.toString() !== userId && project.freelancer.toString() !== userId)) {
      return res.status(403).json({ error: 'Not authorized to access this project' });
    }

    const milestones = await Milestone.find({
      where: { project: projectId }
    });

    const stats = {
      total: milestones.length,
      pending: milestones.filter(m => m.status === 'PENDING').length,
      inProgress: milestones.filter(m => m.status === 'IN_PROGRESS').length,
      submitted: milestones.filter(m => m.status === 'SUBMITTED').length,
      revisionRequested: milestones.filter(m => m.status === 'REVISION_REQUESTED').length,
      approved: milestones.filter(m => m.status === 'APPROVED').length,
      disputed: milestones.filter(m => m.status === 'DISPUTED').length,
      totalValue: milestones.reduce((sum, m) => sum + m.amount, 0),
      completedValue: milestones.filter(m => m.status === 'APPROVED').reduce((sum, m) => sum + m.amount, 0)
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Dispute a milestone - updated to match frontend expectations
router.post('/:milestoneId/dispute', authenticateToken, [
  body('reason').trim().isLength({ min: 1, max: 1000 }),
  body('evidence').optional().isArray()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { milestoneId } = req.params;
    const { reason, evidence = [] } = req.body;
    const userId = req.user.userId;

    // Get milestone
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Verify user is part of the project
    if (!project || (project.client.toString() !== userId && project.freelancer.toString() !== userId)) {
      return res.status(403).json({ error: 'Not authorized to dispute this project' });
    }

    // Check if dispute already exists for this milestone
    const existingDispute = await Dispute.findOne({
      where: {
        project: project._id,
        milestone: milestoneId
      }
    });

    if (existingDispute) {
      return res.status(409).json({ error: 'A dispute already exists for this milestone' });
    }

    // Create dispute
    const dispute = new Dispute({
      project: project._id,
      milestone: milestoneId,
      raisedBy: userId,
      reason,
      evidence: evidence.map(item => ({
        filename: item.filename,
        url: item.url,
        type: item.type || 'file',
        uploadedBy: userId
      }))
    });

    await dispute.save();

    // Update milestone status
    milestone.status = 'DISPUTED';
    await milestone.save();

    // Update project status to disputed
    project.status = 'DISPUTED';
    await project.save();

    // Process with AI for initial analysis if auto-review is enabled
    try {
      const aiAnalysis = await processAIAnalysis({
        projectAgreement: project.description,
        disputeDescription: reason,
        evidence: evidence.map(e => e.url || e.filename).join(', ')
      });

      dispute.aiAnalysis = aiAnalysis;
      await dispute.save();
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      // Continue without AI analysis if it fails
    }

    // Add to project activity log
    project.activityLog.push({
      action: 'DISPUTE_RAISED',
      performedBy: userId,
      details: {
        milestoneId: milestoneId,
        disputeId: dispute._id,
        reason: reason
      }
    });
    await project.save();

    // Notify project participants
    notifyProject(project._id, 'dispute-raised', {
      disputeId: dispute._id,
      milestoneId,
      raisedBy: userId,
      timestamp: new Date(),
      message: `Dispute raised for milestone "${milestone.title}"`
    });

    res.status(201).json({ dispute });
  } catch (error) {
    next(error);
  }
});

module.exports = router;