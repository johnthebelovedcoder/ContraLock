const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const { User, Project, Milestone, Dispute, Transaction } = require('../models/modelManager');
const { Op, Sequelize } = require('sequelize');

const router = express.Router();

// Middleware to verify admin role
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users with pagination and filtering
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (role) {
      whereClause.role = role;
    }
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.find({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Get total count for pagination
    const total = await User.count({ where: whereClause });

    res.json({
      items: users.map(user => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        profile: user.profile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user details
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Include related data
      statistics: {
        projectsCreated: await Project.count({ where: { client: user._id } }),
        projectsWorkedOn: await Project.count({ where: { freelancer: user._id } }),
        milestonesCompleted: await Milestone.count({ 
          where: { 
            project: { [Op.in]: (await Project.findAll({ 
              where: { freelancer: user._id }, 
              attributes: ['_id'] 
            })).map(p => p._id) },
            status: 'APPROVED'
          } 
        }),
        disputesRaised: await Dispute.count({ where: { raisedBy: user._id } })
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user status (activate/suspend)
router.put('/users/:id/status', authenticateToken, requireAdmin, [
  body('status').isIn(['verified', 'suspended', 'pending'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.status = req.body.status;
    await user.save();

    res.json({
      id: user._id,
      status: user.status
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all projects with filtering and pagination
router.get('/projects', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, client, freelancer, search } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (client) {
      whereClause.client = client;
    }
    if (freelancer) {
      whereClause.freelancer = freelancer;
    }
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const projects = await Project.find({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Get total count for pagination
    const total = await Project.count({ where: whereClause });

    res.json({
      items: await Promise.all(projects.map(async project => {
        const client = await User.findById(project.client);
        const freelancer = project.freelancer ? await User.findById(project.freelancer) : null;
        
        return {
          id: project._id,
          title: project.title,
          description: project.description,
          category: project.category,
          budget: project.budget,
          status: project.status,
          client: {
            id: client._id,
            email: client.email,
            firstName: client.firstName,
            lastName: client.lastName
          },
          freelancer: freelancer ? {
            id: freelancer._id,
            email: freelancer.email,
            firstName: freelancer.firstName,
            lastName: freelancer.lastName
          } : null,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        };
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project details
router.get('/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const client = await User.findById(project.client);
    const freelancer = project.freelancer ? await User.findById(project.freelancer) : null;

    // Get milestones for this project
    const milestones = await Milestone.find({ where: { project: project._id } });

    res.json({
      id: project._id,
      title: project.title,
      description: project.description,
      category: project.category,
      budget: project.budget,
      deadline: project.deadline,
      status: project.status,
      client: {
        id: client._id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName
      },
      freelancer: freelancer ? {
        id: freelancer._id,
        email: freelancer.email,
        firstName: freelancer.firstName,
        lastName: freelancer.lastName
      } : null,
      milestones: milestones.map(milestone => ({
        id: milestone._id,
        title: milestone.title,
        amount: milestone.amount,
        status: milestone.status,
        deadline: milestone.deadline,
        createdAt: milestone.createdAt
      })),
      progress: project.progress,
      escrow: project.escrow,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    });
  } catch (error) {
    console.error('Get project details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all disputes with filtering and pagination
router.get('/disputes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, project, milestone } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (project) {
      whereClause.project = project;
    }
    if (milestone) {
      whereClause.milestone = milestone;
    }

    const disputes = await Dispute.find({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Get total count for pagination
    const total = await Dispute.count({ where: whereClause });

    res.json({
      items: await Promise.all(disputes.map(async dispute => {
        const project = await Project.findById(dispute.project);
        const milestone = await Milestone.findById(dispute.milestone);
        const raisedBy = await User.findById(dispute.raisedBy);

        return {
          id: dispute._id,
          project: {
            id: project._id,
            title: project.title
          },
          milestone: {
            id: milestone._id,
            title: milestone.title
          },
          raisedBy: {
            id: raisedBy._id,
            firstName: raisedBy.firstName,
            lastName: raisedBy.lastName,
            email: raisedBy.email
          },
          reason: dispute.reason,
          status: dispute.status,
          resolutionPhase: dispute.resolutionPhase,
          createdAt: dispute.createdAt,
          updatedAt: dispute.updatedAt
        };
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin dashboard summary statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get basic counts
    const [
      totalUsers,
      totalProjects,
      totalDisputes,
      totalTransactions,
      activeProjects,
      disputedProjects
    ] = await Promise.all([
      User.count({ where: {} }),
      Project.count({ where: {} }),
      Dispute.count({ where: {} }),
      Transaction.count({ where: {} }),
      Project.count({ where: { status: { [Op.in]: ['PENDING_ACCEPTANCE', 'AWAITING_DEPOSIT', 'ACTIVE', 'ON_HOLD'] } } }),
      Project.count({ where: { status: 'DISPUTED' } })
    ]);

    // Get recent activity
    const recentUsers = await User.find({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    const recentProjects = await Project.find({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    // Get user statistics by role
    const [clientsCount, freelancersCount, adminsCount] = await Promise.all([
      User.count({ where: { role: 'client' } }),
      User.count({ where: { role: 'freelancer' } }),
      User.count({ where: { role: 'admin' } })
    ]);

    // Get project status breakdown
    const projectStatusBreakdown = await Project.findAll({
      attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('_id')), 'count']],
      group: ['status']
    });

    res.json({
      summary: {
        totalUsers,
        totalProjects,
        totalDisputes,
        totalTransactions,
        activeProjects,
        disputedProjects,
        clientsCount,
        freelancersCount,
        adminsCount
      },
      recentActivity: {
        recentUsers: recentUsers.map(user => ({
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt
        })),
        recentProjects: await Promise.all(recentProjects.map(async project => {
          const client = await User.findById(project.client);
          return {
            id: project._id,
            title: project.title,
            client: client ? `${client.firstName} ${client.lastName}` : 'Unknown',
            status: project.status,
            createdAt: project.createdAt
          };
        }))
      },
      breakdowns: {
        projectStatuses: projectStatusBreakdown.map(row => ({
          status: row.status,
          count: row.dataValues.count
        }))
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin analytics summary (for compatibility with existing frontend)
router.get('/analytics/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get basic counts
    const [
      totalUsers,
      totalProjects,
      totalDisputes,
      totalTransactions,
      activeProjects,
      disputedProjects,
      resolvedDisputes,
      totalVolume,
      disputeRate,
      disputeResolutionRate
    ] = await Promise.all([
      User.count({ where: {} }),
      Project.count({ where: {} }),
      Dispute.count({ where: {} }),
      Transaction.count({ where: {} }),
      Project.count({ where: { status: { [Op.in]: ['PENDING_ACCEPTANCE', 'AWAITING_DEPOSIT', 'ACTIVE', 'ON_HOLD'] } } }),
      Project.count({ where: { status: 'DISPUTED' } }),
      Dispute.count({ where: { status: 'RESOLVED' } }),
      // Using raw query for sum since Sequelize might have issues with SQLite sum
      (async () => {
        const result = await Transaction.findAll({
          attributes: [[Sequelize.fn('SUM', Sequelize.col('amount')), 'total']],
          where: { status: 'COMPLETED' },
          raw: true
        });
        return result[0]?.total || 0;
      })(),
      // Calculate dispute rate as percentage
      (async () => {
        const allProjects = await Project.count({ where: {} });
        return allProjects > 0 ? (await Dispute.count({ where: {} })) / allProjects * 100 : 0;
      })(),
      (async () => {
        const allDisputes = await Dispute.count({ where: {} });
        return allDisputes > 0 ? (await Dispute.count({ where: { status: 'RESOLVED' } })) / allDisputes * 100 : 0;
      })()
    ]);

    // Get average dispute resolution time
    let avgDisputeResolutionTime = 0;
    if (resolvedDisputes > 0) {
      const resolvedDisputesData = await Dispute.findAll({
        where: { status: 'RESOLVED' },
        attributes: ['createdAt', 'updatedAt']
      });

      const totalTime = resolvedDisputesData.reduce((sum, dispute) => {
        const resolutionTime = new Date(dispute.updatedAt) - new Date(dispute.createdAt);
        return sum + resolutionTime;
      }, 0);

      avgDisputeResolutionTime = totalTime / (resolvedDisputes * 24 * 60 * 60 * 1000); // Convert to days
    }

    res.json({
      totalUsers,
      totalProjects,
      totalDisputes,
      totalTransactions,
      activeProjects,
      disputedProjects,
      resolvedDisputes,
      totalVolume,
      disputeRate,
      disputeResolutionRate,
      avgDisputeResolutionTime,
      // Additional metrics
      clientsCount: await User.count({ where: { role: 'client' } }),
      freelancersCount: await User.count({ where: { role: 'freelancer' } }),
      adminsCount: await User.count({ where: { role: 'admin' } })
    });
  } catch (error) {
    console.error('Get admin analytics summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transaction Management endpoints
router.get('/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (type) {
      whereClause.type = type.toUpperCase();
    }
    if (status) {
      whereClause.status = status.toUpperCase();
    }
    if (search) {
      whereClause[Op.or] = [
        { providerTransactionId: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { projectId: { [Op.like]: `%${search}%` } }
      ];
    }

    const transactions = await Transaction.find({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Get total count for pagination
    const total = await Transaction.count({ where: whereClause });

    res.json({
      items: transactions.map(transaction => ({
        id: transaction._id,
        projectId: transaction.projectId,
        milestoneId: transaction.milestoneId,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        from: transaction.from,
        to: transaction.to,
        status: transaction.status,
        provider: transaction.provider,
        providerTransactionId: transaction.providerTransactionId,
        description: transaction.description,
        fees: transaction.fees,
        processedAt: transaction.processedAt,
        failureReason: transaction.failureReason,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;