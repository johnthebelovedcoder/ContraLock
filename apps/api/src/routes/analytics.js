const express = require('express');
const authenticateToken = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User, Project, Milestone, Dispute, Transaction } = require('../models/modelManager');

const router = express.Router();

// Get user dashboard analytics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const analytics = await analyticsService.getUserDashboardAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user project analytics
router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const analytics = await analyticsService.getUserProjectAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    console.error('Get project analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user milestone analytics
router.get('/milestones', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const analytics = await analyticsService.getUserMilestoneAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    console.error('Get milestone analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user financial analytics
router.get('/financial', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const analytics = await analyticsService.getUserFinancialAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    console.error('Get financial analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user dispute analytics
router.get('/disputes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const analytics = await analyticsService.getUserDisputeAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    console.error('Get dispute analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get timeline analytics (trend data)
router.get('/timeline', authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const period = req.query.period || 'monthly';
    
    const analytics = await analyticsService.getUserTimelineAnalytics(userId, period);
    res.json(analytics);
  } catch (error) {
    console.error('Get timeline analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics summary for admin dashboard - DEPRECATED, use admin/analytics/summary instead
router.get('/admin/summary', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get system-wide analytics
    const summary = {
      totalUsers: await User.count({ where: {} }),
      totalProjects: await Project.count({ where: {} }),
      totalMilestones: await Milestone.count({ where: {} }),
      totalDisputes: await Dispute.count({ where: {} }),
      totalTransactions: await Transaction.count({ where: {} }),
      monthlyActiveUsers: await analyticsService.getMonthlyActiveUsers(new Date()),
      monthlyRevenue: await analyticsService.getMonthlyRevenue(new Date()),
      platformFees: await analyticsService.getMonthlyPlatformFees(new Date())
    };

    res.json(summary);
  } catch (error) {
    console.error('Get admin analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;