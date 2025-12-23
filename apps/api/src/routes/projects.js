const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const { Op } = require('sequelize');
const {
  getProjects,
  getProject,
  createProject,
  inviteFreelancer,
  acceptInvitation,
  depositFunds,
  cancelProject
} = require('../controllers/projectController');

const router = express.Router();

// Get all projects for the authenticated user
router.get('/', authenticateToken, getProjects);

// Get a specific project
router.get('/:id', authenticateToken, getProject);

// Create a new project
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('description').trim().isLength({ min: 1, max: 2000 }),
  body('category').isIn(['Design', 'Development', 'Writing', 'Marketing', 'Consulting', 'Other']),
  body('budget').isInt({ min: 5000, max: 10000000 }), // in cents ($50 to $100,000)
  body('deadline').isISO8601(),
  body('milestones').isArray({ min: 1 }),
  body('milestones.*.title').trim().isLength({ min: 1, max: 100 }),
  body('milestones.*.description').trim().isLength({ min: 1, max: 500 }),
  body('milestones.*.amount').isInt({ min: 5000 }), // minimum $50 in cents
  body('milestones.*.deadline').isISO8601(),
  body('milestones.*.acceptanceCriteria').trim().isLength({ min: 1, max: 1000 }),
  body('autoApproveDays').optional().isInt({ min: 1, max: 30 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await createProject(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Invite freelancer to project
router.post('/:projectId/invite', authenticateToken, [
  body('email').isEmail().normalizeEmail()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await inviteFreelancer(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Accept project invitation
router.post('/:projectId/accept', authenticateToken, acceptInvitation);

// Deposit funds to escrow
router.post('/deposit', authenticateToken, [
  body('projectId').isMongoId(),
  body('paymentMethodId').exists().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await depositFunds(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Cancel a project
router.delete('/:projectId', authenticateToken, cancelProject);

// Archive a project
router.patch('/:projectId/archive', authenticateToken, async (req, res, next) => {
  try {
    const { Project: SequelizeProject } = require('../db/sequelizeModels');
    const project = await SequelizeProject.findByPk(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { archiveProject } = require('../controllers/projectController');
    await archiveProject(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Duplicate a project
router.post('/:projectId/duplicate', authenticateToken, async (req, res, next) => {
  try {
    const { Project: SequelizeProject } = require('../db/sequelizeModels');
    const project = await SequelizeProject.findByPk(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { duplicateProject } = require('../controllers/projectController');
    await duplicateProject(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Get project statistics
router.get('/:id/stats', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const { Project: SequelizeProject } = require('../models/modelManager');
    const project = await SequelizeProject.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectJson = project.toJSON ? project.toJSON() : project;

    if (projectJson.client !== userId && projectJson.freelancer !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this project' });
    }

    const Milestone = require('../models/Milestone');
    const milestones = await Milestone.find({ project: id });

    const stats = {
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter(m => m.status === 'APPROVED').length,
      pendingMilestones: milestones.filter(m => m.status === 'PENDING').length,
      inProgressMilestones: milestones.filter(m => m.status === 'IN_PROGRESS').length,
      submittedMilestones: milestones.filter(m => m.status === 'SUBMITTED').length,
      disputedMilestones: milestones.filter(m => m.status === 'DISPUTED').length,
      totalBudget: projectJson.budget,
      releasedAmount: JSON.parse(projectJson.escrow).totalReleased,
      remainingAmount: JSON.parse(projectJson.escrow).remaining,
      completionPercentage: milestones.length > 0
        ? Math.round((milestones.filter(m => m.status === 'APPROVED').length / milestones.length) * 100)
        : 0
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get project activity log
router.get('/:id/activity', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const { Project: SequelizeProject } = require('../models/modelManager');
    const project = await SequelizeProject.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectJson = project.toJSON ? project.toJSON() : project;

    if (projectJson.client !== userId && projectJson.freelancer !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this project' });
    }

    const activityLog = projectJson.activityLog ? JSON.parse(projectJson.activityLog) : [];
    res.json(activityLog);
  } catch (error) {
    next(error);
  }
});

// Get project invitations for a freelancer
router.get('/invitations/freelancer/:freelancerId', authenticateToken, async (req, res, next) => {
  try {
    const { freelancerId } = req.params;
    const userId = req.user.userId;

    // Import Sequelize models directly for proper querying
    const { Project: SequelizeProject, User: SequelizeUser } = require('../db/sequelizeModels');

    // Verify the requesting user is the same as the freelancer or is an admin
    if (freelancerId !== userId) {
      const requestingUser = await SequelizeUser.findByPk(userId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view these project invitations' });
      }
    }

    // Find all projects where this freelancer has been invited (not yet accepted)
    // This assumes invitations are stored in the project activity log or another mechanism
    // For now, we'll find projects where the freelancer is set but status is PENDING_ACCEPTANCE

    const projects = await SequelizeProject.findAll({
      where: {
        freelancer: freelancerId,
        status: 'PENDING_ACCEPTANCE'
      },
      order: [['createdAt', 'DESC']]
    });

    // Populate client information manually
    const populatedProjects = [];
    for (const project of projects) {
      const projectJson = project.toJSON ? project.toJSON() : project;

      if (projectJson.client) {
        const client = await SequelizeUser.findByPk(projectJson.client);
        if (client) {
          const clientJson = client.toJSON ? client.toJSON() : client;
          projectJson.client = {
            firstName: clientJson.firstName,
            lastName: clientJson.lastName,
            email: clientJson.email,
            profile: clientJson.profile
          };
        }
      }

      populatedProjects.push(projectJson);
    }

    res.json(populatedProjects);
  } catch (error) {
    next(error);
  }
});

// Submit counter proposals for project milestones
router.post('/:projectId/counter-proposals', authenticateToken, async (req, res, next) => {
  try {
    const { Project: SequelizeProject } = require('../db/sequelizeModels');
    const project = await SequelizeProject.findByPk(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { submitCounterProposals } = require('../controllers/projectController');
    await submitCounterProposals(req, res, next);
  } catch (error) {
    next(error);
  }
});

module.exports = router;