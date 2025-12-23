const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const {
  getUserDisputes,
  getDispute,
  createDispute,
  addDisputeMessage,
  moveToMediation,
  assignArbitrator,
  resolveDispute,
  evaluateForArbitration
} = require('../controllers/disputeController');
const Project = require('../models/Project');
const User = require('../models/User');
const Dispute = require('../models/Dispute');
const Milestone = require('../models/Milestone');

const router = express.Router();

// Get user disputes
router.get('/', authenticateToken, getUserDisputes);

// Get dispute details
router.get('/:id', authenticateToken, getDispute);

// Create a dispute
router.post('/', authenticateToken, [
  body('projectId').isMongoId(),
  body('milestoneId').isMongoId(),
  body('reason').trim().isLength({ min: 1, max: 1000 }),
  body('evidence').optional().isArray()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await createDispute(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Add a message to a dispute
router.post('/:id/messages', authenticateToken, [
  body('content').trim().isLength({ min: 1, max: 1000 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await addDisputeMessage(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Move dispute to mediation (admin/arbitrator only)
router.post('/:id/mediation', authenticateToken, moveToMediation);

// Assign arbitrator to dispute (admin only)
router.post('/:id/assign-arbitrator', authenticateToken, [
  body('arbitratorId').isMongoId()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await assignArbitrator(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Resolve dispute (by arbitrator)
router.post('/:id/resolve', authenticateToken, [
  body('decision').isIn(['full_payment_to_freelancer', 'partial_payment', 'full_refund_to_client', 'revision_required', 'mutual_agreement']),
  body('amountToFreelancer').isFloat({ min: 0 }),
  body('amountToClient').isFloat({ min: 0 }),
  body('decisionReason').trim().isLength({ min: 1, max: 1000 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await resolveDispute(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Evaluate dispute for escalation to arbitration
router.post('/:id/evaluate-escalation', authenticateToken, evaluateForArbitration);

// AI-processed dispute review endpoint
router.post('/:id/review-automated', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Only admin or arbitrator can trigger AI review
    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'arbitrator')) {
      return res.status(403).json({ error: 'Only admin or arbitrator can trigger dispute AI review' });
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    // Import and use the AI service
    const aiService = require('../services/aiService');

    try {
      const updatedDispute = await aiService.processDisputeForAutoReview(id);

      res.json({
        message: 'AI review completed',
        dispute: updatedDispute
      });
    } catch (aiError) {
      console.error('AI review error:', aiError);
      return res.status(500).json({ error: 'Failed to process AI review', details: aiError.message });
    }
  } catch (error) {
    next(error);
  }
});

// Get dispute report
router.get('/:id/report', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify user is part of the dispute
    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    // Verify user is part of the project
    const project = await Project.findById(dispute.project);
    if (!project || (project.client.toString() !== userId && project.freelancer && project.freelancer.toString() !== userId)) {
      return res.status(403).json({ error: 'Not authorized to view this dispute report' });
    }

    // Import and use the AI service
    const aiService = require('../services/aiService');

    try {
      const report = await aiService.generateDisputeReport(id);

      res.json({
        report
      });
    } catch (aiError) {
      console.error('Generate report error:', aiError);
      return res.status(500).json({ error: 'Failed to generate dispute report', details: aiError.message });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;