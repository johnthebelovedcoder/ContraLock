const { Op } = require('sequelize');
const { User, Project, Milestone, Dispute, Transaction } = require('../models/modelManager');

class AnalyticsService {
  // Get user dashboard analytics
  async getUserDashboardAnalytics(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'client') {
      return await this.getClientAnalytics(userId);
    } else if (user.role === 'freelancer') {
      return await this.getFreelancerAnalytics(userId);
    } else {
      return await this.getAdminAnalytics(userId);
    }
  }

  // Get user project analytics
  async getUserProjectAnalytics(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'client') {
      return await this.getClientProjectAnalytics(userId);
    } else if (user.role === 'freelancer') {
      return await this.getFreelancerProjectAnalytics(userId);
    } else {
      return await this.getAllProjectsAnalytics();
    }
  }

  // Get user milestone analytics
  async getUserMilestoneAnalytics(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'client') {
      return await this.getClientMilestoneAnalytics(userId);
    } else if (user.role === 'freelancer') {
      return await this.getFreelancerMilestoneAnalytics(userId);
    } else {
      return await this.getAllMilestonesAnalytics();
    }
  }

  // Get user financial analytics
  async getUserFinancialAnalytics(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'client') {
      return await this.getClientFinancialAnalytics(userId);
    } else if (user.role === 'freelancer') {
      return await this.getFreelancerFinancialAnalytics(userId);
    } else {
      return await this.getAllFinancialAnalytics();
    }
  }

  // Get user dispute analytics
  async getUserDisputeAnalytics(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'client' || user.role === 'freelancer') {
      return await this.getUserSpecificDisputeAnalytics(userId, user.role);
    } else {
      return await this.getAllDisputesAnalytics();
    }
  }

  // Get timeline analytics for user (trend data)
  async getUserTimelineAnalytics(userId, period = 'monthly') {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Determine date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default: // monthly
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
    }

    if (user.role === 'client') {
      return await this.getClientTimelineAnalytics(userId, startDate, now);
    } else if (user.role === 'freelancer') {
      return await this.getFreelancerTimelineAnalytics(userId, startDate, now);
    } else {
      return await this.getAllTimelineAnalytics(startDate, now);
    }
  }

  // Client-specific analytics
  async getClientAnalytics(userId) {
    const projects = await Project.findAll({
      where: {
        client: userId,
        [Op.or]: [
          { status: { [Op.not]: 'DRAFT' } },
          { status: { [Op.not]: 'CANCELLED' } }
        ]
      }
    });

    const projectIds = projects.map(p => p._id);
    const milestones = await Milestone.findAll({
      where: { project: { [Op.in]: projectIds } }
    });

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { from: userId },
          { projectId: { [Op.in]: projectIds } }
        ]
      }
    });

    // Calculate metrics
    const totalSpent = transactions
      .filter(t => t.type === 'DEPOSIT' || t.type === 'MILESTONE_RELEASE')
      .reduce((sum, t) => sum + t.amount, 0);

    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    const disputedProjects = projects.filter(p => p.status === 'DISPUTED').length;
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'APPROVED').length;

    return {
      totalProjects: projects.length,
      completedProjects,
      activeProjects,
      disputedProjects,
      totalSpent,
      avgProjectValue: projects.length > 0 ? totalSpent / projects.length : 0,
      totalMilestones,
      completedMilestones,
      completionRate: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
    };
  }

  async getClientProjectAnalytics(userId) {
    const projects = await Project.findAll({
      where: { client: userId }
    });

    return {
      totalProjects: projects.length,
      statusBreakdown: {
        DRAFT: projects.filter(p => p.status === 'DRAFT').length,
        PENDING_ACCEPTANCE: projects.filter(p => p.status === 'PENDING_ACCEPTANCE').length,
        AWAITING_DEPOSIT: projects.filter(p => p.status === 'AWAITING_DEPOSIT').length,
        ACTIVE: projects.filter(p => p.status === 'ACTIVE').length,
        ON_HOLD: projects.filter(p => p.status === 'ON_HOLD').length,
        COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
        CANCELLED: projects.filter(p => p.status === 'CANCELLED').length,
        DISPUTED: projects.filter(p => p.status === 'DISPUTED').length
      }
    };
  }

  async getClientMilestoneAnalytics(userId) {
    const projects = await Project.findAll({
      where: { client: userId }
    });

    const projectIds = projects.map(p => p._id);
    const milestones = await Milestone.findAll({
      where: { project: { [Op.in]: projectIds } }
    });

    return {
      totalMilestones: milestones.length,
      statusBreakdown: {
        PENDING: milestones.filter(m => m.status === 'PENDING').length,
        IN_PROGRESS: milestones.filter(m => m.status === 'IN_PROGRESS').length,
        SUBMITTED: milestones.filter(m => m.status === 'SUBMITTED').length,
        APPROVED: milestones.filter(m => m.status === 'APPROVED').length,
        REVISION_REQUESTED: milestones.filter(m => m.status === 'REVISION_REQUESTED').length,
        DISPUTED: milestones.filter(m => m.status === 'DISPUTED').length
      }
    };
  }

  async getClientFinancialAnalytics(userId) {
    const projects = await Project.findAll({
      where: { client: userId }
    });

    const projectIds = projects.map(p => p._id);
    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { from: userId },
          { projectId: { [Op.in]: projectIds } }
        ]
      }
    });

    const deposits = transactions
      .filter(t => t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const milestoneReleases = transactions
      .filter(t => t.type === 'MILESTONE_RELEASE')
      .reduce((sum, t) => sum + t.amount, 0);

    const disputeRefunds = transactions
      .filter(t => t.type === 'DISPUTE_REFUND')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalSpent: deposits,
      totalReleased: milestoneReleases,
      refunds: disputeRefunds,
      netSpent: deposits - milestoneReleases - disputeRefunds
    };
  }

  async getClientTimelineAnalytics(userId, startDate, endDate) {
    const projects = await Project.findAll({
      where: {
        client: userId,
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    });

    const monthlyData = this.groupByMonth(projects, startDate, endDate);

    return {
      newProjects: monthlyData,
      period: { startDate, endDate }
    };
  }

  // Freelancer-specific analytics
  async getFreelancerAnalytics(userId) {
    const projects = await Project.findAll({
      where: { freelancer: userId }
    });

    const projectIds = projects.map(p => p._id);
    const milestones = await Milestone.findAll({
      where: { project: { [Op.in]: projectIds } }
    });

    const transactions = await Transaction.findAll({
      where: { to: userId }
    });

    const totalEarned = transactions.reduce((sum, t) => sum + t.amount, 0);
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'APPROVED').length;
    const disputedMilestones = milestones.filter(m => m.status === 'DISPUTED').length;

    return {
      totalProjects: projects.length,
      completedProjects,
      activeProjects,
      totalEarned,
      avgProjectValue: projects.length > 0 ? totalEarned / projects.length : 0,
      totalMilestones,
      completedMilestones,
      disputedMilestones,
      successRate: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
    };
  }

  async getFreelancerProjectAnalytics(userId) {
    const projects = await Project.findAll({
      where: { freelancer: userId }
    });

    return {
      totalProjects: projects.length,
      statusBreakdown: {
        DRAFT: projects.filter(p => p.status === 'DRAFT').length,
        PENDING_ACCEPTANCE: projects.filter(p => p.status === 'PENDING_ACCEPTANCE').length,
        AWAITING_DEPOSIT: projects.filter(p => p.status === 'AWAITING_DEPOSIT').length,
        ACTIVE: projects.filter(p => p.status === 'ACTIVE').length,
        ON_HOLD: projects.filter(p => p.status === 'ON_HOLD').length,
        COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
        CANCELLED: projects.filter(p => p.status === 'CANCELLED').length,
        DISPUTED: projects.filter(p => p.status === 'DISPUTED').length
      }
    };
  }

  async getFreelancerMilestoneAnalytics(userId) {
    const projects = await Project.findAll({
      where: { freelancer: userId }
    });

    const projectIds = projects.map(p => p._id);
    const milestones = await Milestone.findAll({
      where: { project: { [Op.in]: projectIds } }
    });

    return {
      totalMilestones: milestones.length,
      statusBreakdown: {
        PENDING: milestones.filter(m => m.status === 'PENDING').length,
        IN_PROGRESS: milestones.filter(m => m.status === 'IN_PROGRESS').length,
        SUBMITTED: milestones.filter(m => m.status === 'SUBMITTED').length,
        APPROVED: milestones.filter(m => m.status === 'APPROVED').length,
        REVISION_REQUESTED: milestones.filter(m => m.status === 'REVISION_REQUESTED').length,
        DISPUTED: milestones.filter(m => m.status === 'DISPUTED').length
      }
    };
  }

  async getFreelancerFinancialAnalytics(userId) {
    const transactions = await Transaction.findAll({
      where: { to: userId }
    });

    const milestonePayments = transactions
      .filter(t => t.type === 'MILESTONE_RELEASE')
      .reduce((sum, t) => sum + t.amount, 0);

    const disputePayments = transactions
      .filter(t => t.type === 'DISPUTE_PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = transactions
      .filter(t => t.type === 'WITHDRAWAL')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalEarned: milestonePayments + disputePayments,
      milestonePayments,
      disputePayments,
      withdrawals,
      availableBalance: milestonePayments + disputePayments - withdrawals
    };
  }

  async getFreelancerTimelineAnalytics(userId, startDate, endDate) {
    const milestones = await Milestone.findAll({
      where: {
        project: {
          [Op.in]: (await Project.findAll({ where: { freelancer: userId } })).map(p => p._id)
        },
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    });

    const monthlyData = this.groupByMonth(milestones, startDate, endDate);

    return {
      newMilestones: monthlyData,
      period: { startDate, endDate }
    };
  }

  // Admin-specific analytics
  async getAdminAnalytics(userId) {
    const user = await User.findByPk(userId);
    if (user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const [
      totalUsers,
      totalProjects,
      totalMilestones,
      totalDisputes,
      totalTransactions
    ] = await Promise.all([
      User.count(),
      Project.count(),
      Milestone.count(),
      Dispute.count(),
      Transaction.count()
    ]);

    const transactions = await Transaction.findAll();
    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalFees = transactions.reduce((sum, t) => sum + (t.fees?.total || 0), 0);

    const resolvedDisputes = await Dispute.count({ where: { status: 'RESOLVED' } });

    return {
      totalUsers,
      totalProjects,
      totalMilestones,
      totalDisputes,
      resolvedDisputes,
      totalTransactions,
      totalVolume,
      totalFees,
      disputeResolutionRate: totalDisputes > 0 ? (resolvedDisputes / totalDisputes) * 100 : 0
    };
  }

  async getAllProjectsAnalytics() {
    const projects = await Project.findAll();

    return {
      totalProjects: projects.length,
      statusBreakdown: {
        DRAFT: projects.filter(p => p.status === 'DRAFT').length,
        PENDING_ACCEPTANCE: projects.filter(p => p.status === 'PENDING_ACCEPTANCE').length,
        AWAITING_DEPOSIT: projects.filter(p => p.status === 'AWAITING_DEPOSIT').length,
        ACTIVE: projects.filter(p => p.status === 'ACTIVE').length,
        ON_HOLD: projects.filter(p => p.status === 'ON_HOLD').length,
        COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
        CANCELLED: projects.filter(p => p.status === 'CANCELLED').length,
        DISPUTED: projects.filter(p => p.status === 'DISPUTED').length
      }
    };
  }

  async getAllMilestonesAnalytics() {
    const milestones = await Milestone.findAll();

    return {
      totalMilestones: milestones.length,
      statusBreakdown: {
        PENDING: milestones.filter(m => m.status === 'PENDING').length,
        IN_PROGRESS: milestones.filter(m => m.status === 'IN_PROGRESS').length,
        SUBMITTED: milestones.filter(m => m.status === 'SUBMITTED').length,
        APPROVED: milestones.filter(m => m.status === 'APPROVED').length,
        REVISION_REQUESTED: milestones.filter(m => m.status === 'REVISION_REQUESTED').length,
        DISPUTED: milestones.filter(m => m.status === 'DISPUTED').length
      }
    };
  }

  async getAllFinancialAnalytics() {
    const transactions = await Transaction.findAll();

    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalFees = transactions.reduce((sum, t) => sum + (t.fees?.total || 0), 0);

    return {
      totalVolume,
      totalFees,
      transactionTypeBreakdown: {
        DEPOSITS: transactions.filter(t => t.type === 'DEPOSIT').length,
        MILESTONE_RELEASES: transactions.filter(t => t.type === 'MILESTONE_RELEASE').length,
        DISPUTE_PAYMENTS: transactions.filter(t => t.type === 'DISPUTE_PAYMENT').length,
        DISPUTE_REFUNDS: transactions.filter(t => t.type === 'DISPUTE_REFUND').length,
        WITHDRAWALS: transactions.filter(t => t.type === 'WITHDRAWAL').length,
        REFUNDS: transactions.filter(t => t.type === 'REFUND').length
      }
    };
  }

  async getAllDisputesAnalytics() {
    const disputes = await Dispute.findAll();

    return {
      totalDisputes: disputes.length,
      statusBreakdown: {
        PENDING_REVIEW: disputes.filter(d => d.status === 'PENDING_REVIEW').length,
        IN_MEDIATION: disputes.filter(d => d.status === 'IN_MEDIATION').length,
        IN_ARBITRATION: disputes.filter(d => d.status === 'IN_ARBITRATION').length,
        RESOLVED: disputes.filter(d => d.status === 'RESOLVED').length,
        ESCALATED: disputes.filter(d => d.status === 'ESCALATED').length
      }
    };
  }

  async getAllTimelineAnalytics(startDate, endDate) {
    const [
      projects,
      milestones,
      disputes,
      users
    ] = await Promise.all([
      Project.findAll({ where: { createdAt: { [Op.between]: [startDate, endDate] } } }),
      Milestone.findAll({ where: { createdAt: { [Op.between]: [startDate, endDate] } } }),
      Dispute.findAll({ where: { createdAt: { [Op.between]: [startDate, endDate] } } }),
      User.findAll({ where: { createdAt: { [Op.between]: [startDate, endDate] } } })
    ]);

    const projectsByMonth = this.groupByMonth(projects, startDate, endDate);
    const milestonesByMonth = this.groupByMonth(milestones, startDate, endDate);
    const disputesByMonth = this.groupByMonth(disputes, startDate, endDate);
    const usersByMonth = this.groupByMonth(users, startDate, endDate);

    return {
      projects: projectsByMonth,
      milestones: milestonesByMonth,
      disputes: disputesByMonth,
      users: usersByMonth,
      period: { startDate, endDate }
    };
  }

  // User-specific dispute analytics
  async getUserSpecificDisputeAnalytics(userId, role) {
    let disputes;
    if (role === 'client') {
      // Get disputes where client is involved
      const projectIds = (await Project.findAll({ 
        where: { client: userId } 
      })).map(p => p._id);
      disputes = await Dispute.findAll({
        where: { project: { [Op.in]: projectIds } }
      });
    } else { // freelancer
      const projectIds = (await Project.findAll({ 
        where: { freelancer: userId } 
      })).map(p => p._id);
      disputes = await Dispute.findAll({
        where: { project: { [Op.in]: projectIds } }
      });
    }

    return {
      totalDisputes: disputes.length,
      statusBreakdown: {
        PENDING_REVIEW: disputes.filter(d => d.status === 'PENDING_REVIEW').length,
        IN_MEDIATION: disputes.filter(d => d.status === 'IN_MEDIATION').length,
        IN_ARBITRATION: disputes.filter(d => d.status === 'IN_ARBITRATION').length,
        RESOLVED: disputes.filter(d => d.status === 'RESOLVED').length,
        ESCALATED: disputes.filter(d => d.status === 'ESCALATED').length
      }
    };
  }

  // Helper methods
  groupByMonth(items, startDate, endDate) {
    const result = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // months are 0-indexed
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      
      result[key] = items.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate.getFullYear() === year && itemDate.getMonth() === currentDate.getMonth();
      }).length;
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return result;
  }

  // Get monthly active users
  async getMonthlyActiveUsers(date = new Date()) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // This is a simplified version - in a real system you'd track user activity
    const activeUsers = await User.count({
      where: { 
        updatedAt: { [Op.between]: [startOfMonth, endOfMonth] }
      }
    });

    return activeUsers;
  }

  // Get monthly revenue (for admin)
  async getMonthlyRevenue(date = new Date()) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const transactions = await Transaction.findAll({
      where: {
        createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
        type: { [Op.in]: ['DEPOSIT', 'MILESTONE_RELEASE', 'DISPUTE_PAYMENT'] }
      }
    });

    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  // Get monthly platform fees
  async getMonthlyPlatformFees(date = new Date()) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const transactions = await Transaction.findAll({
      where: {
        createdAt: { [Op.between]: [startOfMonth, endOfMonth] }
      }
    });

    return transactions.reduce((sum, t) => sum + (t.fees?.total || 0), 0);
  }
}

module.exports = new AnalyticsService();